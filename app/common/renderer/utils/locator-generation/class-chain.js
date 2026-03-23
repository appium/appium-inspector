import _ from 'lodash';
import {select as xpathSelect} from 'xpath';

import {LocatorGeneratorBase} from './base.js';

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
      this._logLocatorError('class chain', error);
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
