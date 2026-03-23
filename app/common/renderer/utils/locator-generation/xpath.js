import _ from 'lodash';
import {select as xpathSelect} from 'xpath';

import {LocatorGeneratorBase} from './base.js';

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
      this._logLocatorError('XPath', error);
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
      othersWithAttr = xpathSelect(xpath, this._doc);
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
