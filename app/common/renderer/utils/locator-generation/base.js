import {log} from '../logger.js';

/**
 * Base class for locator generators providing shared utilities for uniqueness checking and error logging
 */
export class LocatorGeneratorBase {
  /**
   * @param {Document} doc - the document containing the DOM
   * @param {Node} domNode - the DOM node to generate locators for
   * @param {Node} [contextNode] - optional context node to scope locator evaluation
   */
  constructor(doc, domNode, contextNode = null) {
    this._doc = doc;
    this._domNode = domNode;
    this._contextNode = contextNode;
    // We only use contextNode as the direct parent of domNode, so all axes will be '/'
    this._nodeAxis = this._contextNode ? '/' : '//';
  }

  /**
   * Get sibling nodes with the same tag name
   *
   * @param {Node} targetNode - the node to find siblings for, defaults to the main DOM node if not provided
   * @returns {Node[]} array of sibling nodes with the same tag name
   */
  _getSiblingsWithSameTag(targetNode = this._domNode) {
    if (!targetNode.parentNode) {
      return [];
    }
    return Array.prototype.slice
      .call(targetNode.parentNode.childNodes, 0)
      .filter((childNode) => childNode.nodeType === 1 && childNode.tagName === targetNode.tagName);
  }

  /**
   * Check if a node is a valid element node
   *
   * @param {Node} targetNode - the node to check, defaults to the main DOM node if not provided
   * @returns {boolean} true if the node is a valid element
   */
  _isValidElementNode(targetNode = this._domNode) {
    return targetNode && targetNode.tagName && targetNode.nodeType === 1;
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
