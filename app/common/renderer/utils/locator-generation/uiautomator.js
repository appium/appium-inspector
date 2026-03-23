import _ from 'lodash';
import {select as xpathSelect} from 'xpath';

import {childNodesOf, domToXML, findDOMNodeByPath, xmlToDOM} from '../source-parsing.js';
import {LocatorGeneratorBase} from './base.js';

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
      this._logLocatorError('uiautomator selector', error);
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
