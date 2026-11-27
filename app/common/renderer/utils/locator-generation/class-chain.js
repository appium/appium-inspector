import {select as xpathSelect} from 'xpath';

import {DRIVERS} from '../../constants/common.js';
import {isEmpty} from '../common.js';
import {LocatorGeneratorBase} from './base.js';

/**
 * Generator for XCUITest & UiAutomator2 Class Chain locators
 * @private
 */
class ClassChainGenerator extends LocatorGeneratorBase {
  /**
   * @param {Document} doc - the document containing the DOM
   * @param {Node} domNode - the DOM node to generate locators for
   * @param {string} automationName - name of the driver using this strategy
   */
  constructor(doc, domNode, automationName) {
    super(doc, domNode, null);
    this._driver = automationName;
    this._isUiA2 = automationName === DRIVERS.UIAUTOMATOR2;
    this._nodeClass = (this._isUiA2 ? this._domNode.getAttribute('class') : this._domNode.tagName) || '*';
  }

  /**
   * Get an optimal class chain for a Node
   *
   * @returns {string|null}
   */
  generate() {
    try {
      // If this isn't an element, return empty string
      if (!this._isValidElementNode()) {
        return '';
      }

      // If this is a root node, return null
      if (this._isRootNode()) {
        return null;
      }

      // Try to find a class chain based on attributes
      const attributeBasedChain = this._tryAttributeBasedClassChain();
      if (attributeBasedChain) {
        return attributeBasedChain;
      }

      // Fall back to hierarchical class chain based on DOM position
      return this._buildHierarchicalClassChain();
    } catch (error) {
      this._logLocatorError('class chain', error);
      return null;
    }
  }

  /**
   * Select the element attributes to use for building the selector, based on the driver.
   */
  get _checkedAttributes() {
    return this._isUiA2 ? ['resource-id', 'text', 'content-desc'] : ['name', 'label', 'value'];
  }

  /**
   * Check if the node is a root node
   *
   * @returns {boolean} true if the node is root
   */
  _isRootNode() {
    const rootNodeClass = this._isUiA2 ? 'hierarchy' : 'XCUIElementTypeApplication';
    return this._nodeClass === rootNodeClass;
  }

  /**
   * Build a class chain expression from a single attribute
   *
   * @param {string} attrName - the attribute name
   * @param {string} attrValue - the attribute value
   * @returns {string} the class chain expression
   */
  _buildClassChainFromAttribute(attrName, attrValue) {
    return `**/${this._nodeClass}[\`${attrName} == "${attrValue}"\`]`;
  }

  /**
   * Build an XPath expression to check uniqueness of an attribute
   *
   * @param {string} attrName - the attribute name
   * @param {string} attrValue - the attribute value
   * @returns {string} the XPath expression
   */
  _buildUniquenessXPath(attrName, attrValue) {
    return `//${this._nodeClass}[@${attrName}="${attrValue}"]`;
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
    for (const attrName of this._checkedAttributes) {
      const attrValue = this._domNode.getAttribute(attrName);
      if (isEmpty(attrValue)) {
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
    let classChain = this._nodeClass;
    const siblings = this._isUiA2 ? this._getSiblingsWithSameClass() : this._getSiblingsWithSameTag();

    // Add index if there are multiple siblings with the same tag
    if (siblings.length > 1) {
      const index = siblings.indexOf(this._domNode);
      classChain += `[${index + 1}]`;
    }

    // Recursively build parent path and prepend it
    const parentStep = new ClassChainGenerator(this._doc, this._domNode.parentNode, this._driver).generate();
    if (parentStep === null) {
      // reached root node - return existing chain without delimiting slash
      return classChain;
    }
    return parentStep + '/' + classChain;
  }

  /**
   * Get sibling nodes with the same class name (UiAutomator2 specific)
   *
   * @param {Node} targetNode - the node to find siblings for, defaults to the main DOM node if not provided
   * @returns {Node[]} array of sibling nodes with the same class name
   */
  _getSiblingsWithSameClass(targetNode = this._domNode) {
    const comparatorFn = (childNode) =>
      childNode.nodeType === 1 && childNode.getAttribute('class') === targetNode.getAttribute('class');
    return this._getSiblingsWithSameProperty(targetNode, comparatorFn);
  }
}

/**
 * Get an optimal class chain for a Node
 *
 * @param {Document} doc
 * @param {Node} domNode
 * @param {string} automationName
 * @returns {string|null}
 */
export function getOptimalClassChain(doc, domNode, automationName) {
  return new ClassChainGenerator(doc, domNode, automationName).generate();
}
