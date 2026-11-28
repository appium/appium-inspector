import {select as xpathSelect} from 'xpath';

import {DRIVERS} from '../../constants/common.js';
import {isEmpty} from '../common.js';
import {LocatorGeneratorBase} from './base.js';

/**
 * Generator for XCUITest & UiAutomator2 Predicate String locators
 * @private
 */
class PredicateStringGenerator extends LocatorGeneratorBase {
  /**
   * @param {Document} doc - the document containing the DOM
   * @param {Node} domNode - the DOM node to generate locators for
   * @param {string} automationName - name of the driver using this strategy
   */
  constructor(doc, domNode, automationName) {
    super(doc, domNode, null);
    this._driver = automationName;
  }

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

      for (const attrName of this._checkedAttributes) {
        const attrValue = this._domNode.getAttribute(attrName);
        if (isEmpty(attrValue)) {
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
      this._logLocatorError('predicate string', error);
      return null;
    }
  }

  /**
   * Select the element attributes to use for building the selector, based on the driver.
   */
  get _checkedAttributes() {
    if (this._driver === DRIVERS.UIAUTOMATOR2) {
      return ['resource-id', 'text', 'content-desc', 'class'];
    }
    return ['name', 'label', 'value', 'type'];
  }
}

/**
 * Get an optimal predicate string for a Node
 * Only works for a single element - no parent/child scope
 *
 * @param {Document} doc
 * @param {Node} domNode
 * @param {string} automationName
 * @returns {string|null}
 */
export function getOptimalPredicateString(doc, domNode, automationName) {
  return new PredicateStringGenerator(doc, domNode, automationName).generate();
}
