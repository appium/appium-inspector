import {log} from '../logger.js';

/**
 * Base class for locator generators providing shared utilities for uniqueness checking and error logging
 */
export class LocatorGeneratorBase {
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

  /**
   * Log an error when a locator strategy fails
   *
   * @param {string} strategy - the locator strategy name
   * @param {Error} error - the error that occurred
   */
  _logLocatorError(strategy, error) {
    log.error(
      `The most optimal ${strategy} could not be determined because an error was thrown: '${error}'`,
    );
  }
}
