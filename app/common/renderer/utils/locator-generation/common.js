import _ from 'lodash';

import {DRIVERS} from '../../constants/common.js';
import {findDOMNodeByPath, xmlToDOM} from '../source-parsing.js';
import {getOptimalClassChain} from './class-chain.js';
import {getOptimalPredicateString} from './predicate.js';
import {getSimpleSuggestedLocators} from './simple.js';
import {getOptimalUiAutomatorSelector} from './uiautomator.js';
import {getOptimalXPath} from './xpath.js';

/**
 * Get suggested selectors for all locator strategies
 *
 * @param {object} selectedElement element node in JSON format
 * @param {string} sourceXML
 * @param {boolean} isNative whether native context is active
 * @param {string} automationName
 * @returns {Array<[string, string]>} array of tuples, consisting of the locator strategy and selector
 */
export function getSuggestedLocators(selectedElement, sourceXML, isNative, automationName) {
  const simpleLocElementProps = {
    tag: selectedElement.tagName,
    attributes: selectedElement.attributes,
  };
  const sourceDoc = xmlToDOM(sourceXML);
  const simpleLocators = getSimpleSuggestedLocators(simpleLocElementProps, sourceDoc, isNative);
  const complexLocators = getComplexSuggestedLocators(
    selectedElement.path,
    sourceDoc,
    isNative,
    automationName,
  );
  return _.toPairs({...simpleLocators, ...complexLocators});
}

/**
 * Get suggested selectors for complex locator strategies (multiple attributes, axes, etc.)
 *
 * @param {string} path a dot-separated string of indices
 * @param {Document} sourceDoc
 * @param {boolean} isNative whether native context is active
 * @param {string} automationName
 * @returns {Record<string, string>} mapping of strategies to selectors
 */
export function getComplexSuggestedLocators(path, sourceDoc, isNative, automationName) {
  let complexLocators = {};
  const domNode = findDOMNodeByPath(path, sourceDoc);
  if (isNative) {
    switch (automationName) {
      case DRIVERS.XCUITEST:
      case DRIVERS.MAC2: {
        const optimalClassChain = getOptimalClassChain(sourceDoc, domNode);
        complexLocators['-ios class chain'] = optimalClassChain ? '**' + optimalClassChain : null;
        complexLocators['-ios predicate string'] = getOptimalPredicateString(sourceDoc, domNode);
        break;
      }
      case DRIVERS.UIAUTOMATOR2: {
        complexLocators['-android uiautomator'] = getOptimalUiAutomatorSelector(
          sourceDoc,
          domNode,
          path,
        );
        break;
      }
    }
  }
  complexLocators.xpath = getOptimalXPath(sourceDoc, domNode);

  // Remove entries for locators where the optimal selector could not be found
  return _.omitBy(complexLocators, _.isNil);
}
