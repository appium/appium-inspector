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

  // Limit for how many ancestors to traverse when looking for a unique parent scope in Phase 2,
  // if we already have a semi-unique xpath from Phase 1.
  static ANCESTOR_TRAVERSAL_LIMIT = 2;

  // Regex to identify the last tag in an xpath, used for optimizing parent-scoped xpaths
  // by replacing it with a more specific semi-unique xpath from Phase 1
  static LAST_TAG_REGEX = /\/[^/]+$/;

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
      const {nodeXpath, nodeIndex} = this._findBestNodeScopeXPath();
      if (nodeXpath && nodeIndex === 0) {
        return nodeXpath;
      }

      // Phase 2: Try to find a scoped XPath using a unique ancestor
      const scopedXpath = this._findBestParentScopeXPath(nodeXpath);
      if (scopedXpath) {
        return scopedXpath;
      } else if (nodeXpath && nodeIndex > 0) {
        // If the scoped xpath failed but we did previously find a semi-unique xpath, fallback to that
        return this._buildSemiUniqueXPath(nodeXpath, nodeIndex);
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
   * @returns {number | undefined} the xpath index in the set of other similar nodes,
   * or undefined if the xpath is invalid and cannot be evaluated
   */
  _determineXpathUniqueness(xpath) {
    let othersWithAttr = [];
    // Searches under a context node must start with '.'
    const contextedXpath = this._contextNode ? '.' + xpath : xpath;

    // If the XPath does not parse, move to the next unique attribute
    try {
      othersWithAttr = xpathSelect(contextedXpath, this._contextNode || this._doc);
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
   * @returns {{nodeXpath: string, nodeIndex: number}|{}} the XPath and index if unique, or empty object if not unique
   */
  _tryNodeTagNameForUniqueXPath() {
    let nodeXpath = `${this._nodeAxis}${this._domNode.tagName}`;
    const nodeIndex = this._determineXpathUniqueness(nodeXpath);
    if (nodeIndex !== 0) {
      return {};
    }

    // Even if this node name is unique, if it's the root node, use '/' instead of '//'
    if (!this._isValidElementNode(this._domNode.parentNode)) {
      nodeXpath = `/${this._domNode.tagName}`;
    }
    return {nodeXpath, nodeIndex};
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
    return `${this._nodeAxis}${tagForXpath}[@${attrName}="${attrValue}"]`;
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
    return `${this._nodeAxis}${tagForXpath}[@${attr1Name}="${attr1Value}" and @${attr2Name}="${attr2Value}"]`;
  }

  /**
   * Build a semi-unique XPath with an index qualifier
   *
   * @param {string} xpath - the base XPath expression
   * @param {number} index - the index of the resulting element in the matching set (1-based)
   * @returns {string} the XPath with index qualifier
   */
  _buildSemiUniqueXPath(xpath, index) {
    return `(${xpath})[${index}]`;
  }

  /**
   * Try to find a unique XPath by testing attributes
   *
   * @param {string[]|[string, string][]} attrs - attributes to test (single attributes or pairs)
   * @returns {{nodeXpath: string, nodeIndex: number}|{}} the XPath and node index if found, or empty object if not found
   */
  _tryNodeAttributesForUniqueXPath(attrs) {
    const tagForXpath = this._domNode.tagName || '*';
    const isPairs = attrs.length > 0 && _.isArray(attrs[0]);
    let semiUniqueXpath;
    let semiUniqueXpathIndex;

    for (const attrName of attrs) {
      const nodeXpath = isPairs
        ? this._buildXPathFromAttributePair(attrName, tagForXpath)
        : this._buildXPathFromSingleAttribute(attrName, tagForXpath);

      if (!nodeXpath) {
        continue;
      }

      const nodeIndex = this._determineXpathUniqueness(nodeXpath);
      if (nodeIndex === 0) {
        return {nodeXpath, nodeIndex};
      }

      // Store the current semi-unique xpath and its index only if its index
      // is better (lower) than any previously found semi-unique xpath.
      // This is not guaranteed to be the best option if parent nodes will also be required,
      // but it is still better than just saving the first one.
      if (!semiUniqueXpathIndex && !_.isUndefined(nodeIndex)) {
        semiUniqueXpath = nodeXpath;
        semiUniqueXpathIndex = nodeIndex;
      }
    }

    return {nodeXpath: semiUniqueXpath, nodeIndex: semiUniqueXpathIndex};
  }

  /**
   * Given an xml doc and a current dom node, try to find a robust xpath selector qualified by
   * key attributes, which is unique in the document (or unique plus index).
   *
   * @param {string[]|[string, string][]} attrs - a list of attributes to consider, or
   * a list of pairs of attributes to consider in conjunction
   *
   * @returns {{xpath: string, nodeIndex: number}|{}} the XPath and node index if found, or empty object if not found
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
   * @returns {{nodeXpath: string, nodeIndex: number}|{}} the XPath and node index if found, or empty object if not found
   */
  _findBestNodeScopeXPath() {
    const cases = this._buildUniqueXPathFinderCases();
    let semiUniqueXpath;
    let semiUniqueXpathIndex;

    for (const attrs of cases) {
      const {nodeXpath, nodeIndex} = this._getUniqueNodeScopeXPath(attrs);
      if (nodeIndex === 0) {
        return {nodeXpath, nodeIndex};
      }
      // Store the current semi-unique xpath and its index only if its index
      // is better (lower) than any previously found semi-unique xpath.
      // This is not guaranteed to be the best option if parent nodes will also be required,
      // but it is still better than just saving the first one.
      if (!semiUniqueXpathIndex && !_.isUndefined(nodeIndex)) {
        semiUniqueXpath = nodeXpath;
        semiUniqueXpathIndex = nodeIndex;
      }
    }

    return {nodeXpath: semiUniqueXpath, nodeIndex: semiUniqueXpathIndex};
  }

  // #endregion
  // #region Phase 2 - Parent

  /**
   * Find the closest ancestor node that has a unique identifying attribute or tag name.
   * If Phase 1 found a semi-unique XPath, only check ancestors up to a certain limit
   * to avoid traversing too far up the tree and therefore generating overly long and brittle XPaths
   * (compared to the Phase 1 XPath, which uses only the node).
   * If we didn't get anything from Phase 1, we can ignore this limit, since if we were to return early due to this,
   * the code would proceed with Phase 3, which also traverses up the path, but without any limits.
   *
   * @param {string|null} nodeScopeXpath - the semi-unique XPath from Phase 1, without index
   * @returns {{node: ParentNode, xpath: string}|{}} Object with {node, xpath} or empty object if no unique ancestor found
   */
  _findUniqueAncestor(nodeScopeXpath) {
    let ancestor = this._domNode.parentNode;
    let curAncestorCount = 1;

    while (this._isValidElementNode(ancestor)) {
      if (nodeScopeXpath && curAncestorCount > XPathGenerator.ANCESTOR_TRAVERSAL_LIMIT) {
        break;
      }
      const ancestorGenerator = new XPathGenerator(this._doc, ancestor);
      const {nodeXpath, nodeIndex} = ancestorGenerator._findBestNodeScopeXPath();
      // Only use the xpath if it is fully unique
      if (nodeXpath && nodeIndex === 0) {
        return {node: ancestor, xpath: nodeXpath};
      }
      ancestor = ancestor.parentNode;
      curAncestorCount++;
    }

    return {};
  }

  /**
   * Build an XPath scoped to a unique ancestor
   *
   * @param {Node} ancestorNode - The unique ancestor node
   * @param {string} ancestorXpath - The XPath that uniquely identifies the ancestor
   * @returns {string} Parent-scoped XPath
   */
  _buildParentScopedXPath(ancestorNode, ancestorXpath) {
    let currentNode = this._domNode;
    let cumulativeDescendantXpath = '';

    // Assemble the path upwards from the target node to the ancestor,
    // trying to use unique identifiers for each node along the path when possible
    while (this._isValidElementNode(currentNode) && currentNode !== ancestorNode) {
      // Try to uniquely identify the current node within the context of its parent node
      const nodeParentScopeGenerator = new XPathGenerator(this._doc, currentNode, currentNode.parentNode);
      const {nodeXpath, nodeIndex} = nodeParentScopeGenerator._findBestNodeScopeXPath();

      if (nodeXpath && nodeIndex === 0) {
        // If the path is fully unique, use that
        cumulativeDescendantXpath = nodeXpath + cumulativeDescendantXpath;
      } else {
        // If not unique, keep only the tag name and add a sibling index
        // This can probably be optimized further if the sibling index is greater than nodeIndex
        const siblings = this._getSiblingsWithSameTag(currentNode);
        const nodeTagNameXpath = `/${currentNode.tagName}[${siblings.indexOf(currentNode) + 1}]`;
        cumulativeDescendantXpath = nodeTagNameXpath + cumulativeDescendantXpath;
      }
      currentNode = currentNode.parentNode;
    }

    return ancestorXpath + cumulativeDescendantXpath;
  }

  /**
   * Optimize a parent-scoped XPath by attempting to reduce its final index, if any
   *
   * @param {string} parentScopedXpath - the parent-scoped XPath to optimize
   * @param {string|null} nodeScopeXpath - the semi-unique XPath from Phase 1, without index
   * @returns {string|null} Optimized parent-scoped XPath, or null if it is not good enough
   */
  _optimizeParentScopedXpath(parentScopedXpath, nodeScopeXpath) {
    // If Phase 1 did not return any semi-unique xpath, or parentScopedXpath doesn't have an improvable index,
    // just use parentScopedXpath as is
    if (!nodeScopeXpath || !parentScopedXpath.endsWith(']')) {
      return this._determineXpathUniqueness(parentScopedXpath) === 0 ? parentScopedXpath : null;
    }
    // Replace the last tag name + index with the Phase 1 xpath (without its index).
    // It is guaranteed to NOT be unique (otherwise it would have been picked up by _buildParentScopedXPath),
    // but it could still give us a better index than the one in parentScopedXpath.
    const combinedScopeXpath = parentScopedXpath.replace(
      XPathGenerator.LAST_TAG_REGEX,
      nodeScopeXpath.replace(/^\/\//, '/'),
    );
    const combinedScopeXpathIndex = this._determineXpathUniqueness(combinedScopeXpath);
    if (_.isUndefined(combinedScopeXpathIndex)) {
      // Should never happen
      return null;
    }
    if (combinedScopeXpathIndex === 0) {
      // Should never happen
      return combinedScopeXpath;
    }
    // Compare the three indices we have:
    // * The index from Phase 1 for the node scope xpath (nodeScopeIndex)
    // * The index of just the node in parentScopedXpath (parentScopedXpathNodeIndex)
    // * The index of combinedScopeXpath (combinedScopeXpathIndex)
    //
    // We can unconditionally use combinedScopeXpathIndex, because:
    // * combinedScopeXpathIndex <= nodeScopeIndex: same node xpath, more specific parent tag
    // * combinedScopeXpathIndex <= parentScopedXpathNodeIndex: same parent xpath, more specific node tag
    return this._buildSemiUniqueXPath(combinedScopeXpath, combinedScopeXpathIndex);
  }

  /**
   * Try to find a scoped XPath using a unique ancestor
   *
   * @param {string|null} nodeScopeXpath - the semi-unique XPath from Phase 1, without index
   * @returns {string|null} Parent-scoped XPath or null if not found
   */
  _findBestParentScopeXPath(nodeScopeXpath) {
    const ancestor = this._findUniqueAncestor(nodeScopeXpath);
    if (_.isEmpty(ancestor)) {
      return null;
    }
    const parentScopedXpath = this._buildParentScopedXPath(ancestor.node, ancestor.xpath);
    return this._optimizeParentScopedXpath(parentScopedXpath, nodeScopeXpath);
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
