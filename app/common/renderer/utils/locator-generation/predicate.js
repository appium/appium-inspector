import _ from 'lodash';
import {select as xpathSelect} from 'xpath';

import {LocatorGeneratorBase} from './base.js';

/**
 * Get an optimal predicate string for a Node
 * Only works for a single element - no parent/child scope
 *
 * @param {Document} doc
 * @param {Node} domNode
 * @returns {string|null}
 */
export function getOptimalPredicateString(doc, domNode) {
  return new PredicateStringGenerator(doc, domNode).generate();
}

/**
 * Generator for iOS Predicate String locators
 * @private
 */
class PredicateStringGenerator extends LocatorGeneratorBase {
  // Attributes to check when generating predicate string locators
  static CHECKED_ATTRIBUTES = ['name', 'label', 'value', 'type'];

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

      for (const attrName of PredicateStringGenerator.CHECKED_ATTRIBUTES) {
        const attrValue = this._domNode.getAttribute(attrName);
        if (_.isEmpty(attrValue)) {
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
}
