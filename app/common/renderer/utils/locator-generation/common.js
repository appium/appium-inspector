import {DRIVERS} from '../../constants/common.js';
import {ALL_STRATEGIES} from '../../constants/locator-strategies.js';
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
  const complexLocators = getComplexSuggestedLocators(selectedElement.path, sourceDoc, isNative, automationName);
  return Object.entries({...simpleLocators, ...complexLocators});
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
    if ([DRIVERS.XCUITEST, DRIVERS.MAC2, DRIVERS.UIAUTOMATOR2].includes(automationName)) {
      const optimalClassChain = getOptimalClassChain(sourceDoc, domNode, automationName);
      const optimalPredicateString = getOptimalPredicateString(sourceDoc, domNode, automationName);
      if (automationName === DRIVERS.UIAUTOMATOR2) {
        complexLocators[ALL_STRATEGIES.ANDROID_CLASS_CHAIN] = optimalClassChain;
        complexLocators[ALL_STRATEGIES.ANDROID_PREDICATE] = optimalPredicateString;
      } else {
        complexLocators[ALL_STRATEGIES.IOS_CLASS_CHAIN] = optimalClassChain;
        complexLocators[ALL_STRATEGIES.IOS_PREDICATE] = optimalPredicateString;
      }
    }
    if (automationName === DRIVERS.UIAUTOMATOR2) {
      complexLocators[ALL_STRATEGIES.ANDROID_UIAUTOMATOR] = getOptimalUiAutomatorSelector(sourceDoc, domNode, path);
    }
  }
  complexLocators.xpath = getOptimalXPath(sourceDoc, domNode);

  // Remove entries for locators where the optimal selector could not be found
  return Object.fromEntries(Object.entries(complexLocators).filter(([, v]) => v != null));
}
