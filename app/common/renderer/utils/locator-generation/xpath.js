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
      // Phase 0: if this isn't an element, we're above the root, return empty string
      if (!this._isValidElementNode()) {
        return '';
      }

      // Phase 1: try to find a unique XPath based on the node itself (attributes or tagname)
      const [nodeXpath, nodeIndex] = this._findBestNodeScopeXPath();
      if (nodeXpath && nodeIndex === 0) {
        return nodeXpath;
      }

      // Phase 2: Try to find a scoped XPath using a unique ancestor
      const scopedXPath = this._findBestParentScopeXPath(nodeXpath);
      if (scopedXPath) {
        return scopedXPath;
      }

      // Phase 3: Fall back to hierarchical XPath based on DOM position
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
   * @returns {number | null} the xpath index in the set of other similar nodes,
   * or null if the xpath is invalid and cannot be evaluated
   */
  _determineXpathUniqueness(xpath) {
    let othersWithAttr = [];

    // If the XPath does not parse, move to the next unique attribute
    try {
      othersWithAttr = xpathSelect(xpath, this._doc);
    } catch {
      return undefined;
    }

    if (othersWithAttr.length > 1) {
      return othersWithAttr.indexOf(this._domNode) + 1; // XPath indices are 1-based
    }

    return 0;
  }

  // #region Phase 1 - Node

  /**
   * Try to find a unique XPath based on the node's tag name alone
   *
   * @returns {[string, number]|[]} tuple of [xpath, nodeIndex] if unique, or empty array if not unique
   */
  _tryNodeTagNameForUniqueXPath() {
    let xpath = `//${this._domNode.tagName}`;
    const nodeIndex = this._determineXpathUniqueness(xpath);
    if (nodeIndex !== 0) {
      return [];
    }

    // Even if this node name is unique, if it's the root node, use '/' instead of '//'
    if (!this._domNode.parentNode?.tagName) {
      xpath = `/${this._domNode.tagName}`;
    }
    return [xpath, 0];
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
   * Try to find a unique XPath by testing attributes
   *
   * @param {string[]|[string, string][]} attrs - attributes to test (single attributes or pairs)
   * @returns {[string, number]|[]} tuple of [xpath, nodeIndex], or empty array if not found
   */
  _tryNodeAttributesForUniqueXPath(attrs) {
    const tagForXpath = this._domNode.tagName || '*';
    const isPairs = attrs.length > 0 && _.isArray(attrs[0]);
    let uniqueXpath;
    let semiUniqueXpath;
    let semiUniqueXpathIndex;

    for (const attrName of attrs) {
      const xpath = isPairs
        ? this._buildXPathFromAttributePair(attrName, tagForXpath)
        : this._buildXPathFromSingleAttribute(attrName, tagForXpath);

      if (!xpath) {
        continue;
      }

      const nodeIndex = this._determineXpathUniqueness(xpath);
      if (nodeIndex === 0) {
        uniqueXpath = xpath;
        break;
      }

      // Store the current semi-unique xpath and its index only if its index
      // is better (lower) than any previously found semi-unique xpath.
      // This is not guaranteed to be the best option if parent nodes will also be required,
      // but it is still better than just saving the first one.
      if (!semiUniqueXpathIndex && !_.isUndefined(nodeIndex)) {
        semiUniqueXpath = xpath;
        semiUniqueXpathIndex = nodeIndex;
      }
    }

    if (uniqueXpath) {
      return [uniqueXpath, 0];
    }
    if (semiUniqueXpath) {
      return [semiUniqueXpath, semiUniqueXpathIndex];
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
   * @returns {[string, number]|[]} tuple of [xpath, nodeIndex], or empty array if not found
   */
  _getUniqueNodeScopeXPath(attrs) {
    // If we're looking for a unique //<nodetype>, return it only if it's actually unique
    if (attrs.length === 0) {
      return this._tryNodeTagNameForUniqueXPath();
    }

    return this._tryNodeAttributesForUniqueXPath(attrs);
  }

  /**
   * Build the list of cases to try when generating an XPath
   *
   * @returns {Array<string[]|[string, string][]>} array of attribute configurations to test
   */
  _buildUniqueXPathFinderCases() {
    const allAttributes = [
      ...XPathGenerator.UNIQUE_ATTRIBUTES,
      ...XPathGenerator.MAYBE_UNIQUE_ATTRIBUTES,
    ];
    const attrPairsPermutations = allAttributes.flatMap((v1, i) =>
      allAttributes.slice(i + 1).map((v2) => [v1, v2]),
    );

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
   * @returns {[string|undefined, boolean|undefined]} tuple consisting of:
   * (1) the best xpath selector discovered, and
   * (2) 0 if the xpath is fully unique, or the xpath index of the node in the matching set (1-based)
   */
  _findBestNodeScopeXPath() {
    const cases = this._buildUniqueXPathFinderCases();
    let semiUniqueXpath;
    let semiUniqueXpathIndex;

    for (const attrs of cases) {
      const [xpath, nodeIndex] = this._getUniqueNodeScopeXPath(attrs);
      if (nodeIndex === 0) {
        return [xpath, nodeIndex];
      }
      // Store the current semi-unique xpath and its index only if its index
      // is better (lower) than any previously found semi-unique xpath.
      // This is not guaranteed to be the best option if parent nodes will also be required,
      // but it is still better than just saving the first one.
      if (!semiUniqueXpathIndex && !_.isUndefined(nodeIndex)) {
        semiUniqueXpath = xpath;
        semiUniqueXpathIndex = nodeIndex;
      }
    }

    return [semiUniqueXpath, semiUniqueXpathIndex];
  }

  // #endregion
  // #region Phase 2 - Parent

  /**
   * Find the closest ancestor node that has a unique identifying attribute or tag name
   *
   * @returns {Object|null} Object with {node, xpath} or null if no unique ancestor found
   */
  _findUniqueAncestor() {
    let ancestor = this._domNode.parentNode;

    while (ancestor && ancestor.tagName) {
      const ancestorGenerator = new XPathGenerator(this._doc, ancestor);
      const [xpath, nodeIndex] = ancestorGenerator._findBestNodeScopeXPath();
      // Ignore the result if it is not fully unique
      if (xpath && nodeIndex === 0) {
        return {node: ancestor, xpath};
      }
      ancestor = ancestor.parentNode;
    }

    return null;
  }

  /**
   * Build an XPath scoped to a unique ancestor
   *
   * @param {Node} ancestor - The unique ancestor node
   * @param {string} ancestorXpath - The XPath that uniquely identifies the ancestor
   * @param {string|null} nodeScopeXpath - the semi-unique XPath from Phase 1, without index
   * @returns {string|null} Parent-scoped XPath or null if unable to build
   */
  _buildParentScopedXPath(ancestorNode, ancestorXpath, nodeScopeXpath) {
    let currentNode = this._domNode;
    let cumulativeDescendantXpath = '';

    // Assemble the path upwards from the current node to the ancestor, adding indices as needed
    while (currentNode !== ancestorNode && currentNode && currentNode.tagName) {
      const siblings = currentNode.parentNode?.childNodes
        ? Array.from(currentNode.parentNode.childNodes).filter(
            (n) => n.nodeType === 1 && n.tagName === currentNode.tagName,
          )
        : [];
      const relativeCurrentNodeXpath =
        siblings.length > 1
          ? `/${currentNode.tagName}[${siblings.indexOf(currentNode) + 1}]`
          : `/${currentNode.tagName}`;
      cumulativeDescendantXpath = relativeCurrentNodeXpath + cumulativeDescendantXpath;
      currentNode = currentNode.parentNode;
    }

    const fullXpath = ancestorXpath + cumulativeDescendantXpath;
    // If Phase 1 returned a semi-unique nodeScopeXpath, but it required an index,
    // and the node still has an index in the currently assembled xpath,
    // check if we can now use the Phase 1 xpath without an index
    if (nodeScopeXpath && fullXpath.endsWith(']')) {
      const fullXpathWithNodeScope = fullXpath.replace(
        /\/[^/]+$/,
        nodeScopeXpath.replace(/^\/\//, '/'),
      );
      const fullXpathWithNodeScopeIndex = this._determineXpathUniqueness(fullXpathWithNodeScope);
      if (fullXpathWithNodeScopeIndex === 0) {
        return fullXpathWithNodeScope;
      }
      // Index still needed - fall back to the previous xpath
    }
    const fullXpathIndex = this._determineXpathUniqueness(fullXpath);
    return fullXpathIndex === 0 ? fullXpath : null;
  }

  /**
   * Try to find a scoped XPath using a unique ancestor
   *
   * @param {string|null} nodeScopeXpath - the semi-unique XPath from Phase 1, without index
   * @returns {string|null} Parent-scoped XPath or null if not found
   */
  _findBestParentScopeXPath(nodeScopeXpath) {
    const ancestor = this._findUniqueAncestor();
    if (!ancestor) {
      return null;
    }
    return this._buildParentScopedXPath(ancestor.node, ancestor.xpath, nodeScopeXpath);
  }

  // #endregion
  // #region Phase 3 - Raw

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

  // #endregion
}
