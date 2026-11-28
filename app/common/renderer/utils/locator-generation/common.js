import {ALL_STRATEGIES, DRIVER_STRATEGIES} from '../../constants/locator-strategies.js';
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
 * Creates a list of all generatable complex locator strategy names and their generator functions
 *
 * @param {string} path a dot-separated string of indices
 * @param {Document} sourceDoc
 * @param {Node} domNode
 * @param {string} automationName
 * @returns {[{strat: string, gen: function}]} list of objects containing a locator strategy and its generator function
 */
const createComplexLocatorGenList = (path, sourceDoc, domNode, automationName) => [
  {strat: ALL_STRATEGIES.IOS_CLASS_CHAIN, gen: () => getOptimalClassChain(sourceDoc, domNode, automationName)},
  {strat: ALL_STRATEGIES.IOS_PREDICATE, gen: () => getOptimalPredicateString(sourceDoc, domNode, automationName)},
  {strat: ALL_STRATEGIES.ANDROID_CLASS_CHAIN, gen: () => getOptimalClassChain(sourceDoc, domNode, automationName)},
  {strat: ALL_STRATEGIES.ANDROID_PREDICATE, gen: () => getOptimalPredicateString(sourceDoc, domNode, automationName)},
  {strat: ALL_STRATEGIES.ANDROID_UIAUTOMATOR, gen: () => getOptimalUiAutomatorSelector(sourceDoc, domNode, path)},
  // XPath is excluded since it is always calculated
];

/**
 * Get suggested selectors for complex locator strategies (multiple attributes, axes, etc.)
 *
 * @param {string} path a dot-separated string of indices
 * @param {Document} sourceDoc
 * @param {boolean} isNative whether native context is active
 * @param {string} automationName
 * @returns {Record<string, string>} mapping of strategies to selectors
 */
function getComplexSuggestedLocators(path, sourceDoc, isNative, automationName) {
  let complexLocators = {};
  const domNode = findDOMNodeByPath(path, sourceDoc);
  if (isNative) {
    const complexLocatorGenList = createComplexLocatorGenList(path, sourceDoc, domNode, automationName);
    for (const stratPair of complexLocatorGenList) {
      if (automationName in DRIVER_STRATEGIES && DRIVER_STRATEGIES[automationName].includes(stratPair.strat)) {
        complexLocators[stratPair.strat] = stratPair.gen();
      }
    }
  }
  complexLocators[ALL_STRATEGIES.XPATH] = getOptimalXPath(sourceDoc, domNode);

  // Remove entries for locators where the optimal selector could not be found
  return Object.fromEntries(Object.entries(complexLocators).filter(([, v]) => v != null));
}
