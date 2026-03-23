import cssEscape from 'css.escape';
import _ from 'lodash';
import XPath from 'xpath';

import {LOCATOR_STRATEGIES as STRATS} from '../../constants/session-inspector.js';

/**
 * Get suggested selectors for simple locator strategies (which match a specific attribute)
 *
 * @param {Record<string, string|object>} elementProps relevant element properties
 * @param {Document} sourceDoc
 * @param {boolean} [isNative=true] whether native context is active
 * @returns {Record<string, string>} mapping of strategies to selectors
 */
export function getSimpleSuggestedLocators(elementProps, sourceDoc, isNative = true) {
  const simpleLocGen = new SimpleLocatorGenerator(elementProps, sourceDoc);
  return isNative ? simpleLocGen.generateNativeSelectors() : simpleLocGen.generateWebSelectors();
}

/**
 * Check whether the provided tag is unique in the source.
 * Applies whitespace normalization to the input tag name,
 * since they cannot have spaces
 *
 * @param {string} tagName
 * @param {Document} node
 * @returns {boolean}
 */
export function isTagUnique(tagName, node) {
  if (!doesDocumentExist(node)) {
    return true;
  }
  const trimmedTagName = toTrimmedString(tagName);
  if (!trimmedTagName) {
    return false;
  }
  return isXpathUnique('//*[name()=$tagName]', {variables: {tagName: trimmedTagName}, node});
}

/**
 * Check whether the provided attribute & value are unique in the source
 * Applies whitespace normalization to the attribute name,
 * since they cannot have spaces
 *
 * @param {string} attrName
 * @param {string} attrValue
 * @param {Document} node
 * @returns {boolean}
 */
export function areAttrAndValueUnique(attrName, attrValue, node) {
  if (!doesDocumentExist(node)) {
    return true;
  }
  const trimmedAttrName = toTrimmedString(attrName);
  if (!trimmedAttrName || !toTrimmedString(attrValue)) {
    return false;
  }
  // if node exists, that means xmlToDOM was called, which already validates attribute names,
  // so the attribute name is safe to use directly
  return isXpathUnique(`//*[@${trimmedAttrName}=$attrValue]`, {variables: {attrValue}, node});
}

/**
 * Trim whitespace from a string value,
 * otherwise return an empty string
 *
 * @param {*} value input value
 * @returns {string} trimmed string
 */
function toTrimmedString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Convenience check for whether the document node exists
 *
 * @param {Document | undefined} node document node
 * @returns {boolean}
 */
function doesDocumentExist(node) {
  // If no node provided, assume the xpath is unique
  return Boolean(node) && !_.isEmpty(node);
}

/**
 * Parse and evaluate an xpath using the built-in safe variable replacement,
 * then check whether it finds exactly one element
 *
 * @param {string} xpath
 * @param {Record<string, unknown>} options options for XPathEvaluator
 * @see https://github.com/goto100/xpath/blob/master/docs/XPathEvaluator.md
 * @returns {boolean}
 */
function isXpathUnique(xpath, options) {
  return XPath.parse(xpath).select(options).length === 1;
}

/**
 * Generator for simple locator strategies in both native and webview contexts
 * @private
 */
class SimpleLocatorGenerator {
  // Map of native element attributes to their matching simple (optimal) locator strategies
  static NATIVE_STRATEGY_MAP = [
    ['name', STRATS.ACCESSIBILITY_ID],
    ['content-desc', STRATS.ACCESSIBILITY_ID],
    ['id', STRATS.ID],
    ['rntestid', STRATS.ID],
    ['resource-id', STRATS.ID],
    ['class', STRATS.CLASS_NAME],
    ['type', STRATS.CLASS_NAME],
  ];

  /**
   * @param {Record<string, string|object>} elementProps relevant element properties
   * @param {Document} sourceDoc - the source document
   */
  constructor(elementProps, sourceDoc) {
    this._doc = sourceDoc;
    this._tag = elementProps.tag;
    this._attributes = elementProps.attributes;
  }

  /**
   * Get suggested selectors for simple locator strategies in native context:
   * id, class name, and accessibility id
   *
   * @returns {Record<string, string>} mapping of native strategies to selectors
   */
  generateNativeSelectors() {
    return SimpleLocatorGenerator.NATIVE_STRATEGY_MAP.reduce((res, [strategyAlias, strategy]) => {
      const value = this._attributes?.[strategyAlias];
      if (value && areAttrAndValueUnique(strategyAlias, value, this._doc)) {
        res[strategy] = value;
      }
      return res;
    }, {});
  }

  /**
   * Get suggested selectors for simple locator strategies in webview context:
   * id (css) and tag name
   *
   * @returns {Record<string, string>} mapping of web strategies to selectors
   */
  generateWebSelectors() {
    const webStrategyMap = {};
    // id (css)
    const idValue = this._attributes?.id;
    if (idValue && areAttrAndValueUnique('id', idValue, this._doc)) {
      webStrategyMap[STRATS.CSS] = `#${cssEscape(idValue)}`;
    }
    // tag name
    if (isTagUnique(this._tag, this._doc)) {
      webStrategyMap[STRATS.TAG_NAME] = this._tag;
    }
    return webStrategyMap;
  }
}
