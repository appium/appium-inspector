import _ from 'lodash';
import XPath, {select as xpathSelect} from 'xpath';

import {log} from './logger.js';
import {childNodesOf, domToXML, findDOMNodeByPath, xmlToDOM} from './source-parsing.js';

// ============================================================================
// Public API
// ============================================================================

/**
 * Check whether the provided attribute & value are unique in the source
 *
 * @param {string} attrName
 * @param {string} attrValue
 * @param {Document} sourceDoc
 * @returns {boolean}
 */
export function areAttrAndValueUnique(attrName, attrValue, sourceDoc) {
  // If no sourceDoc provided, assume it's unique
  if (!sourceDoc || _.isEmpty(sourceDoc)) {
    return true;
  }
  return xpathSelect(`//*[@${attrName}="${attrValue.replace(/"/g, '')}"]`, sourceDoc).length < 2;
}

/**
 * Get suggested selectors for simple locator strategies (which match a specific attribute)
 *
 * @param {Record<string, string|number>} attributes element attributes
 * @param {Document} sourceDoc
 * @param {boolean} [isNative=true] whether native context is active
 * @returns {Record<string, string>} mapping of strategies to selectors
 */
export function getSimpleSuggestedLocators(attributes, sourceDoc, isNative = true) {
  return new SimpleLocatorGenerator(attributes, sourceDoc, isNative).generate();
}

/**
 * Get suggested selectors for complex locator strategies (multiple attributes, axes, etc.)
 *
 * @param {string} path a dot-separated string of indices
 * @param {Document} sourceDoc
 * @param {boolean} isNative whether native context is active
 * @param {string} automationName
 * @returns {Record<string, string>} mapping of strategies to selectors
 */
export function getComplexSuggestedLocators(path, sourceDoc, isNative, automationName) {
  let complexLocators = {};
  const domNode = findDOMNodeByPath(path, sourceDoc);
  if (isNative) {
    switch (automationName) {
      case 'xcuitest':
      case 'mac2': {
        const optimalClassChain = getOptimalClassChain(sourceDoc, domNode);
        complexLocators['-ios class chain'] = optimalClassChain ? '**' + optimalClassChain : null;
        complexLocators['-ios predicate string'] = getOptimalPredicateString(sourceDoc, domNode);
        break;
      }
      case 'uiautomator2': {
        complexLocators['-android uiautomator'] = getOptimalUiAutomatorSelector(
          sourceDoc,
          domNode,
          path,
        );
        break;
      }
    }
  }
  complexLocators.xpath = getOptimalXPath(sourceDoc, domNode);

  // Remove entries for locators where the optimal selector could not be found
  return _.omitBy(complexLocators, _.isNil);
}

/**
 * Get suggested selectors for all locator strategies
 *
 * @param {string} selectedElement element node in JSON format
 * @param {string} sourceXML
 * @param {boolean} isNative whether native context is active
 * @param {string} automationName
 * @returns {Array<[string, string]>} array of tuples, consisting of the locator strategy and selector
 */
export function getSuggestedLocators(selectedElement, sourceXML, isNative, automationName) {
  const sourceDoc = xmlToDOM(sourceXML);
  const simpleLocators = getSimpleSuggestedLocators(
    selectedElement.attributes,
    sourceDoc,
    isNative,
  );
  const complexLocators = getComplexSuggestedLocators(
    selectedElement.path,
    sourceDoc,
    isNative,
    automationName,
  );
  return _.toPairs({...simpleLocators, ...complexLocators});
}

/**
 * Get an optimal XPath for a Node
 *
 * @param {Document} doc
 * @param {Node} domNode
 * @returns {string|null}
 */
export function getOptimalXPath(doc, domNode) {
  return new XPathGenerator(doc, domNode).generate();
}

/**
 * Get an optimal class chain for a Node
 *
 * @param {Document} doc
 * @param {Node} domNode
 * @returns {string|null}
 */
export function getOptimalClassChain(doc, domNode) {
  return new ClassChainGenerator(doc, domNode).generate();
}

/**
 * Get an optimal predicate string for a Node
 * Only works for a single element - no parent/child scope
 *
 * @param {Document} doc
 * @param {Node} domNode
 * @returns {string|null}
 */
export function getOptimalPredicateString(doc, domNode) {
  return new PredicateStringGenerator(doc, domNode).generate();
}

/**
 * Get an optimal UiAutomator selector for a Node
 * Only works for elements inside the last direct child of the hierarchy (xpath: /hierarchy/*[last()] )
 *
 * @param {Document} doc
 * @param {Node} domNode
 * @param {string} path a dot-separated string of indices
 * @returns {string|null}
 */
export function getOptimalUiAutomatorSelector(doc, domNode, path) {
  return new UiAutomatorGenerator(doc, domNode, path).generate();
}

// ============================================================================
// Private Implementation Classes
// ============================================================================

/**
 * Base class for locator generators providing shared utilities for uniqueness checking and error logging
 * @private
 */
class LocatorGeneratorBase {
  /**
   * @param {Document} doc - the document containing the DOM
   * @param {Node} domNode - the DOM node to generate locators for
   */
  constructor(doc, domNode) {
    this._doc = doc;
    this._domNode = domNode;
  }

  /**
   * Get sibling nodes with the same tag name
   *
   * @returns {Node[]} array of sibling nodes with the same tag name
   */
  _getSiblingsWithSameTag() {
    if (!this._domNode.parentNode) {
      return [];
    }
    return Array.prototype.slice
      .call(this._domNode.parentNode.childNodes, 0)
      .filter(
        (childNode) => childNode.nodeType === 1 && childNode.tagName === this._domNode.tagName,
      );
  }

  /**
   * Check if a node is a valid element node
   *
   * @returns {boolean} true if the node is a valid element
   */
  _isValidElementNode() {
    return this._domNode.tagName && this._domNode.nodeType === 1;
  }
}

/**
 * Generator for XPath locators
 * @private
 */
class XPathGenerator extends LocatorGeneratorBase {
  // Attributes on nodes that are likely to be unique to the node so we should consider first when
  // suggesting xpath locators. These are considered IN ORDER.
  static UNIQUE_ATTRIBUTES = ['name', 'content-desc', 'id', 'resource-id', 'accessibility-id'];

  // Attributes that we should recommend as a fallback but ideally only in conjunction with other
  // attributes
  static MAYBE_UNIQUE_ATTRIBUTES = ['label', 'text', 'value'];

  /**
   * Get an optimal XPath for a Node
   *
   * @returns {string|null}
   */
  generate() {
    try {
      // If this isn't an element, we're above the root, return empty string
      if (!this._isValidElementNode()) {
        return '';
      }

      // Try to find a unique XPath based on attributes or node name
      const uniqueXpath = this._tryCasesForUniqueXPath();
      if (uniqueXpath) {
        return uniqueXpath;
      }

      // Fall back to hierarchical XPath based on DOM position
      return this._buildHierarchicalXPath();
    } catch (error) {
      logLocatorError('XPath', error);
      return null;
    }
  }

  /**
   * Return information about whether an xpath query results in a unique element, and the non-unique
   * index of the element in the document if not unique
   *
   * @param {string} xpath
   * @returns {[boolean]|[boolean, number]} tuple consisting of (1) whether the xpath is unique and (2) its index in
   * the set of other similar nodes if not unique
   */
  _determineXpathUniqueness(xpath) {
    let othersWithAttr = [];

    // If the XPath does not parse, move to the next unique attribute
    try {
      // eslint-disable-next-line import/no-named-as-default-member -- needed for Vitest spy functionality
      othersWithAttr = XPath.select(xpath, this._doc);
    } catch {
      return [false];
    }

    if (othersWithAttr.length > 1) {
      return [false, othersWithAttr.indexOf(this._domNode)];
    }

    return [true];
  }

  /**
   * Try to find a unique XPath based on the node's tag name alone
   *
   * @returns {[string, boolean]|[]} tuple of [xpath, isUnique] or empty array if not unique
   */
  _tryNodeNameXPath() {
    let xpath = `//${this._domNode.tagName}`;
    const [isUnique] = this._determineXpathUniqueness(xpath);
    if (!isUnique) {
      return [];
    }

    // Even if this node name is unique, if it's the root node, use '/' instead of '//'
    if (!this._domNode.parentNode?.tagName) {
      xpath = `/${this._domNode.tagName}`;
    }
    return [xpath, true];
  }

  /**
   * Build an XPath expression from a single attribute
   *
   * @param {string} attrName - the attribute name
   * @param {string} tagForXpath - the tag name to use in the XPath
   * @returns {string|undefined} the XPath expression or undefined if attribute is missing
   */
  _buildXPathFromSingleAttribute(attrName, tagForXpath) {
    const attrValue = this._domNode.getAttribute(attrName);
    if (!attrValue) {
      return undefined;
    }
    return `//${tagForXpath}[@${attrName}="${attrValue}"]`;
  }

  /**
   * Build an XPath expression from a pair of attributes
   *
   * @param {[string, string]} attrPair - pair of attribute names
   * @param {string} tagForXpath - the tag name to use in the XPath
   * @returns {string|undefined} the XPath expression or undefined if any attribute is missing
   */
  _buildXPathFromAttributePair(attrPair, tagForXpath) {
    const [attr1Name, attr2Name] = attrPair;
    const attr1Value = this._domNode.getAttribute(attr1Name);
    const attr2Value = this._domNode.getAttribute(attr2Name);
    if (!attr1Value || !attr2Value) {
      return undefined;
    }
    return `//${tagForXpath}[@${attr1Name}="${attr1Value}" and @${attr2Name}="${attr2Value}"]`;
  }

  /**
   * Build a semi-unique XPath with an index qualifier
   *
   * @param {string} xpath - the base XPath expression
   * @param {number} index - the index of the node in the matching set
   * @returns {string} the XPath with index qualifier
   */
  _buildSemiUniqueXPath(xpath, index) {
    return `(${xpath})[${index + 1}]`;
  }

  /**
   * Try to find a unique XPath by testing attributes
   *
   * @param {string[]|[string, string][]} attrs - attributes to test (single attributes or pairs)
   * @returns {[string|undefined, boolean|undefined]} tuple of [xpath, isUnique] or empty values
   */
  _tryAttributesForUniqueXPath(attrs) {
    const tagForXpath = this._domNode.tagName || '*';
    const isPairs = attrs.length > 0 && _.isArray(attrs[0]);
    let uniqueXpath;
    let semiUniqueXpath;

    for (const attrName of attrs) {
      const xpath = isPairs
        ? this._buildXPathFromAttributePair(attrName, tagForXpath)
        : this._buildXPathFromSingleAttribute(attrName, tagForXpath);

      if (!xpath) {
        continue;
      }

      const [isUnique, indexIfNotUnique] = this._determineXpathUniqueness(xpath);
      if (isUnique) {
        uniqueXpath = xpath;
        break;
      }

      // Store the first semi-unique XPath we find for fallback
      if (!semiUniqueXpath && !_.isUndefined(indexIfNotUnique)) {
        semiUniqueXpath = this._buildSemiUniqueXPath(xpath, indexIfNotUnique);
      }
    }

    if (uniqueXpath) {
      return [uniqueXpath, true];
    }
    if (semiUniqueXpath) {
      return [semiUniqueXpath, false];
    }
    return [];
  }

  /**
   * Given an xml doc and a current dom node, try to find a robust xpath selector qualified by
   * key attributes, which is unique in the document (or unique plus index).
   *
   * @param {string[]|[string, string][]} attrs - a list of attributes to consider, or
   * a list of pairs of attributes to consider in conjunction
   *
   * @returns {[string|undefined, boolean|undefined]} tuple consisting of (1) the xpath selector discovered, and (2)
   * whether this selector is absolutely unique in the document (true) or qualified by index (false)
   */
  _getUniqueXPath(attrs) {
    // If we're looking for a unique //<nodetype>, return it only if it's actually unique
    if (attrs.length === 0) {
      return this._tryNodeNameXPath();
    }

    return this._tryAttributesForUniqueXPath(attrs);
  }

  /**
   * Build all permutations of attribute pairs from the given attributes
   *
   * @param {string[]} attributes - list of attributes to permute
   * @returns {[string, string][]} array of attribute pairs
   */
  _buildAttributePairsPermutations(attributes) {
    return attributes.flatMap((v1, i) => attributes.slice(i + 1).map((v2) => [v1, v2]));
  }

  /**
   * Build the list of cases to try when generating an XPath
   *
   * @returns {Array<string[]|[string, string][]>} array of attribute configurations to test
   */
  _buildXPathCases() {
    const allAttributes = [
      ...XPathGenerator.UNIQUE_ATTRIBUTES,
      ...XPathGenerator.MAYBE_UNIQUE_ATTRIBUTES,
    ];
    const attrPairsPermutations = this._buildAttributePairsPermutations(allAttributes);

    return [
      // Try unique attributes first
      XPathGenerator.UNIQUE_ATTRIBUTES,
      // Try pairs of attributes (unique + maybe)
      attrPairsPermutations,
      // Try maybe-unique attributes alone
      XPathGenerator.MAYBE_UNIQUE_ATTRIBUTES,
      // Try node name alone as last resort
      [],
    ];
  }

  /**
   * Try all XPath cases and return the first unique or best semi-unique result
   *
   * @returns {string|undefined} the best XPath found, or undefined if none found
   */
  _tryCasesForUniqueXPath() {
    const cases = this._buildXPathCases();
    let semiUniqueXpath;

    for (const attrs of cases) {
      const [xpath, isFullyUnique] = this._getUniqueXPath(attrs);
      if (isFullyUnique) {
        return xpath;
      }
      // Keep the first semi-unique XPath we find
      if (!semiUniqueXpath && xpath) {
        semiUniqueXpath = xpath;
      }
    }

    return semiUniqueXpath;
  }

  /**
   * Build a hierarchical XPath based on the node's position in the DOM tree
   *
   * @returns {string} hierarchical XPath for this node
   */
  _buildHierarchicalXPath() {
    let xpath = `/${this._domNode.tagName}`;
    const siblings = this._getSiblingsWithSameTag();

    // Add index if there are multiple siblings with the same tag
    if (siblings.length > 1) {
      const index = siblings.indexOf(this._domNode);
      xpath += `[${index + 1}]`;
    }

    // Recursively build parent path and prepend it
    const parentGenerator = new XPathGenerator(this._doc, this._domNode.parentNode);
    return parentGenerator.generate() + xpath;
  }
}

/**
 * Generator for iOS Class Chain locators
 * @private
 */
class ClassChainGenerator extends LocatorGeneratorBase {
  // Attributes to check when generating class chain locators
  static CHECKED_ATTRIBUTES = ['name', 'label', 'value'];

  /**
   * Get an optimal class chain for a Node
   *
   * @returns {string|null}
   */
  generate() {
    try {
      // If this isn't an element or is XCUIElementTypeApplication, return empty string
      if (this._cannotProcessNode()) {
        return '';
      }

      // Try to find a class chain based on attributes
      const attributeBasedChain = this._tryAttributeBasedClassChain();
      if (attributeBasedChain) {
        return attributeBasedChain;
      }

      // Fall back to hierarchical class chain based on DOM position
      return this._buildHierarchicalClassChain();
    } catch (error) {
      logLocatorError('class chain', error);
      return null;
    }
  }

  /**
   * Check if the node can be processed for class chain generation
   *
   * @returns {boolean} true if the node cannot be processed
   */
  _cannotProcessNode() {
    return !this._isValidElementNode() || this._domNode.tagName === 'XCUIElementTypeApplication';
  }

  /**
   * Build a class chain expression from a single attribute
   *
   * @param {string} attrName - the attribute name
   * @param {string} attrValue - the attribute value
   * @returns {string} the class chain expression
   */
  _buildClassChainFromAttribute(attrName, attrValue) {
    const tagName = this._domNode.tagName || '*';
    return `/${tagName}[\`${attrName} == "${attrValue}"\`]`;
  }

  /**
   * Build an XPath expression to check uniqueness of an attribute
   *
   * @param {string} attrName - the attribute name
   * @param {string} attrValue - the attribute value
   * @returns {string} the XPath expression
   */
  _buildUniquenessXPath(attrName, attrValue) {
    const tagName = this._domNode.tagName || '*';
    return `//${tagName}[@${attrName}="${attrValue}"]`;
  }

  /**
   * Build a class chain with index qualifier for non-unique matches
   *
   * @param {string} classChain - the base class chain
   * @param {number} index - the index of the node in the matching set
   * @returns {string} the class chain with index qualifier
   */
  _buildClassChainWithIndex(classChain, index) {
    return `${classChain}[${index + 1}]`;
  }

  /**
   * Try to find a unique class chain based on attributes
   *
   * @returns {string|undefined} the class chain if found, undefined otherwise
   */
  _tryAttributeBasedClassChain() {
    for (const attrName of ClassChainGenerator.CHECKED_ATTRIBUTES) {
      const attrValue = this._domNode.getAttribute(attrName);
      if (_.isEmpty(attrValue)) {
        continue;
      }

      const xpath = this._buildUniquenessXPath(attrName, attrValue);
      let othersWithAttr;

      // If the XPath does not parse, move to the next attribute
      try {
        othersWithAttr = xpathSelect(xpath, this._doc);
      } catch {
        continue;
      }

      // Build the class chain from this attribute
      let classChain = this._buildClassChainFromAttribute(attrName, attrValue);

      // If the attribute isn't unique, add index qualifier
      if (othersWithAttr.length > 1) {
        const index = othersWithAttr.indexOf(this._domNode);
        classChain = this._buildClassChainWithIndex(classChain, index);
      }

      return classChain;
    }

    return undefined;
  }

  /**
   * Build a hierarchical class chain based on the node's position in the DOM tree
   *
   * @returns {string} hierarchical class chain for this node
   */
  _buildHierarchicalClassChain() {
    let classChain = `/${this._domNode.tagName}`;
    const siblings = this._getSiblingsWithSameTag();

    // Add index if there are multiple siblings with the same tag
    if (siblings.length > 1) {
      const index = siblings.indexOf(this._domNode);
      classChain += `[${index + 1}]`;
    }

    // Recursively build parent path and prepend it
    const parentGenerator = new ClassChainGenerator(this._doc, this._domNode.parentNode);
    return parentGenerator.generate() + classChain;
  }
}

/**
 * Generator for iOS Predicate String locators
 * @private
 */
class PredicateStringGenerator extends LocatorGeneratorBase {
  // Attributes to check when generating predicate string locators
  static CHECKED_ATTRIBUTES = ['name', 'label', 'value', 'type'];

  /**
   * Get an optimal predicate string for a Node
   * Only works for a single element - no parent/child scope
   *
   * @returns {string|null}
   */
  generate() {
    try {
      // BASE CASE #1: If this isn't an element, or we're above the root, return empty string
      if (!this._isValidElementNode()) {
        return '';
      }

      // BASE CASE #2: Check all attributes and try to find the best way
      let xpathAttributes = [];
      let predicateString = [];
      let othersWithAttr;

      for (const attrName of PredicateStringGenerator.CHECKED_ATTRIBUTES) {
        const attrValue = this._domNode.getAttribute(attrName);
        if (_.isEmpty(attrValue)) {
          continue;
        }

        xpathAttributes.push(`@${attrName}="${attrValue}"`);
        const xpath = `//*[${xpathAttributes.join(' and ')}]`;
        predicateString.push(`${attrName} == "${attrValue}"`);

        // If the XPath does not parse, move to the next attribute
        try {
          othersWithAttr = xpathSelect(xpath, this._doc);
        } catch {
          continue;
        }

        // Return as soon as the accumulated attribute combination is unique
        if (othersWithAttr.length === 1) {
          return predicateString.join(' AND ');
        }
      }
    } catch (error) {
      // If there's an unexpected exception, abort
      logLocatorError('predicate string', error);
      return null;
    }
  }
}

/**
 * Generator for Android UiAutomator locators
 * @private
 */
class UiAutomatorGenerator extends LocatorGeneratorBase {
  // Map of element attributes to their UiAutomator syntax, ordered by (likely) decreasing uniqueness
  static CHECKED_ATTRIBUTES = [
    ['resource-id', 'resourceId'],
    ['text', 'text'],
    ['content-desc', 'description'],
    ['class', 'className'],
  ];

  /**
   * @param {Document} doc - the document containing the DOM
   * @param {Node} domNode - the DOM node to generate locators for
   * @param {string} path - a dot-separated string of indices
   */
  constructor(doc, domNode, path) {
    super(doc, domNode);
    this._path = path;
  }

  /**
   * Get an optimal UiAutomator selector for a Node
   * Only works for elements inside the last direct child of the hierarchy (xpath: /hierarchy/*[last()] )
   *
   * @returns {string|null}
   */
  generate() {
    try {
      // If this isn't an element, return empty string
      if (!this._isValidElementNode()) {
        return '';
      }

      // Check if element is in the last hierarchy child
      if (!this._isInLastHierarchyChild()) {
        return null;
      }

      // Create a new document scope with only the last hierarchy child
      const {newDoc, newDomNode} = this._createLastHierarchyChildScope();

      // Try to find a unique UiAutomator selector
      return this._tryFindUniqueSelector(newDoc, newDomNode);
    } catch (error) {
      logLocatorError('uiautomator selector', error);
      return null;
    }
  }

  /**
   * Get the hierarchy children from the document
   *
   * @returns {Node[]} array of hierarchy children
   */
  _getHierarchyChildren() {
    const docChildren = childNodesOf(this._doc);
    if (_.isEmpty(docChildren)) {
      return [];
    }
    const hierarchyChildren = childNodesOf(docChildren[0]);
    return hierarchyChildren || [];
  }

  /**
   * Check if the element is in the last hierarchy child
   *
   * @returns {boolean} true if element is in the last hierarchy child
   */
  _isInLastHierarchyChild() {
    const hierarchyChildren = this._getHierarchyChildren();
    if (_.isEmpty(hierarchyChildren)) {
      return false;
    }

    const lastHierarchyChildIndex = (hierarchyChildren.length - 1).toString();
    const pathArray = this._path.split('.');
    const requestedHierarchyChildIndex = pathArray[0];

    return requestedHierarchyChildIndex === lastHierarchyChildIndex;
  }

  /**
   * Create a new document scope containing only the last hierarchy child
   *
   * @returns {{newDoc: Document, newDomNode: Node}} new document and node in the new scope
   */
  _createLastHierarchyChildScope() {
    const hierarchyChildren = this._getHierarchyChildren();
    const lastHierarchyChildIndex = (hierarchyChildren.length - 1).toString();
    const lastHierarchyChild = hierarchyChildren[lastHierarchyChildIndex];

    // Convert the last hierarchy child to XML and wrap it in a dummy tag to create a Document
    const newXml = domToXML(lastHierarchyChild);
    const newDoc = xmlToDOM(`<dummy>${newXml}</dummy>`);

    // Modify the path to start from index 0 in the new scope
    const pathArray = this._path.split('.');
    pathArray[0] = '0';
    const newPath = pathArray.join('.');

    // Find the node in the new document scope
    const newDomNode = findDOMNodeByPath(newPath, newDoc);

    return {newDoc, newDomNode};
  }

  /**
   * Build a UiAutomator selector from an attribute
   *
   * @param {string} attrTranslation - the UiAutomator method name
   * @param {string} attrValue - the attribute value
   * @returns {string} the UiAutomator selector
   */
  _buildUiSelector(attrTranslation, attrValue) {
    return `new UiSelector().${attrTranslation}("${attrValue}")`;
  }

  /**
   * Build a UiAutomator selector with instance index
   *
   * @param {string} uiSelector - the base UiAutomator selector
   * @param {number} index - the instance index
   * @returns {string} the UiAutomator selector with instance
   */
  _buildUiSelectorWithInstance(uiSelector, index) {
    return `${uiSelector}.instance(${index})`;
  }

  /**
   * Build an XPath to check uniqueness of an attribute in the new document scope
   *
   * @param {Node} domNode - the DOM node in the new scope
   * @param {string} attrName - the attribute name
   * @param {string} attrValue - the attribute value
   * @returns {string} the XPath expression
   */
  _buildUniquenessXPath(domNode, attrName, attrValue) {
    return `//${domNode.tagName}[@${attrName}="${attrValue}"]`;
  }

  /**
   * Try to find a unique UiAutomator selector based on attributes
   *
   * @param {Document} doc - the document scope to search in
   * @param {Node} domNode - the DOM node in the new scope
   * @returns {string|undefined} the most unique selector found, or undefined
   */
  _tryFindUniqueSelector(doc, domNode) {
    let mostUniqueSelector;
    let othersWithAttrMinCount;

    for (const [attrName, attrTranslation] of UiAutomatorGenerator.CHECKED_ATTRIBUTES) {
      const attrValue = domNode.getAttribute(attrName);
      if (_.isEmpty(attrValue)) {
        continue;
      }

      const xpath = this._buildUniquenessXPath(domNode, attrName, attrValue);
      const uiSelector = this._buildUiSelector(attrTranslation, attrValue);

      // If the XPath does not parse, move to the next attribute
      let othersWithAttr;
      try {
        othersWithAttr = xpathSelect(xpath, doc);
      } catch {
        continue;
      }

      // If the attribute is unique, return it immediately
      if (othersWithAttr.length === 1) {
        return uiSelector;
      }

      // Keep track of the selector with the least matches
      if (!othersWithAttrMinCount || othersWithAttr.length < othersWithAttrMinCount) {
        othersWithAttrMinCount = othersWithAttr.length;
        const index = othersWithAttr.indexOf(domNode);
        mostUniqueSelector = this._buildUiSelectorWithInstance(uiSelector, index);
      }
    }

    return mostUniqueSelector;
  }
}

/**
 * Generator for simple locator strategies (id, class name, accessibility id)
 * @private
 */
class SimpleLocatorGenerator {
  // Map of element attributes to their matching simple (optimal) locator strategies
  static STRATEGY_MAPPINGS = [
    ['name', 'accessibility id'],
    ['content-desc', 'accessibility id'],
    ['id', 'id'],
    ['rntestid', 'id'],
    ['resource-id', 'id'],
    ['class', 'class name'],
    ['type', 'class name'],
  ];

  /**
   * @param {Record<string, string|number>} attributes - element attributes
   * @param {Document} sourceDoc - the source document
   * @param {boolean} [isNative=true] - whether native context is active
   */
  constructor(attributes, doc, isNative = true) {
    this._doc = doc;
    this._attributes = attributes;
    this._isNative = isNative;
  }

  /**
   * Get suggested selectors for simple locator strategies (which match a specific attribute)
   *
   * @returns {Record<string, string>} mapping of strategies to selectors
   */
  generate() {
    return SimpleLocatorGenerator.STRATEGY_MAPPINGS.reduce((res, [strategyAlias, strategy]) => {
      // accessibility id is only supported in native context
      if (!(strategy === 'accessibility id' && !this._isNative)) {
        const value = this._attributes[strategyAlias];
        if (value && areAttrAndValueUnique(strategyAlias, value, this._doc)) {
          res[strategy] = value;
        }
      }
      return res;
    }, {});
  }
}

/**
 * Log an error when a locator strategy fails
 *
 * @param {string} strategy - the locator strategy name
 * @param {Error} error - the error that occurred
 */
function logLocatorError(strategy, error) {
  log.error(
    `The most optimal ${strategy} could not be determined because an error was thrown: '${error}'`,
  );
}
