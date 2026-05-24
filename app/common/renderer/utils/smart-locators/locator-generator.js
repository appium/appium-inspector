import _ from 'lodash';

import {DRIVERS} from '../../constants/common.js';
import {LOCATOR_STRATEGIES as STRATS, NATIVE_APP} from '../../constants/session-inspector.js';

const ACCESSIBILITY_ATTRIBUTES = ['content-desc', 'name', 'accessibility-id'];
const ID_ATTRIBUTES = ['resource-id', 'id', 'rntestid'];
const CLASS_ATTRIBUTES = ['class', 'type'];
const TEXT_ATTRIBUTES = ['text', 'label', 'value'];

const UIAUTOMATOR_ATTRIBUTE_METHODS = {
  'resource-id': 'resourceId',
  text: 'text',
  'content-desc': 'description',
  class: 'className',
};

const UIAUTOMATOR_METHOD_ATTRIBUTES = _.invert(UIAUTOMATOR_ATTRIBUTE_METHODS);

/**
 * Quote a string for XPath literal syntax.
 * XPath 1.0 has no escaping inside string literals, so values containing both
 * quote types must be assembled with concat().
 *
 * @param {string} value
 * @returns {string}
 */
export function quoteXPathLiteral(value) {
  const stringValue = String(value);
  if (!stringValue.includes("'")) {
    return `'${stringValue}'`;
  }
  if (!stringValue.includes('"')) {
    return `"${stringValue}"`;
  }
  return `concat(${stringValue
    .split("'")
    .map((part) => `'${part}'`)
    .join(', "\'", ')})`;
}

/**
 * Generate a readable XPath matching one attribute value.
 *
 * @param {string} attributeName
 * @param {string} attributeValue
 * @returns {string}
 */
export function buildAttributeXPath(attributeName, attributeValue) {
  return `//*[@${attributeName}=${quoteXPathLiteral(attributeValue)}]`;
}

/**
 * Generate a UiSelector locator for a supported Android attribute.
 *
 * @param {string} attributeName
 * @param {string} attributeValue
 * @returns {string|null}
 */
export function buildUiAutomatorSelector(attributeName, attributeValue) {
  const methodName = UIAUTOMATOR_ATTRIBUTE_METHODS[attributeName];
  if (!methodName) {
    return null;
  }
  return `new UiSelector().${methodName}(${JSON.stringify(attributeValue)})`;
}

/**
 * Infer the source attribute used by a UiSelector.
 *
 * @param {string} selector
 * @returns {string|null}
 */
export function getUiAutomatorSourceAttribute(selector) {
  const match = String(selector).match(/new UiSelector\(\)\.(\w+)\(/);
  return match ? UIAUTOMATOR_METHOD_ATTRIBUTES[match[1]] || null : null;
}

/**
 * Infer the source attribute value used by a UiSelector.
 *
 * @param {string} selector
 * @returns {string|null}
 */
export function getUiAutomatorSourceValue(selector) {
  const match = String(selector).match(/new UiSelector\(\)\.\w+\("((?:\\"|[^"])*)"\)/);
  return match ? match[1].replace(/\\"/g, '"') : null;
}

/**
 * Creates locator candidates for ranking. This intentionally includes locators
 * that the existing suggested-locator table may filter out, because weak
 * locators need an explicit score and warning.
 *
 * @param {object} selectedElement
 * @param {object} [options]
 * @param {string} [options.currentContext]
 * @param {string} [options.automationName]
 * @returns {Array<object>}
 */
export function generateSmartLocatorCandidates(
  selectedElement,
  {currentContext = NATIVE_APP, automationName} = {},
) {
  const attributes = selectedElement?.attributes || {};
  const existingStrategyMap = selectedElement?.strategyMap || [];
  const candidates = [];
  const isNative = currentContext === NATIVE_APP;
  const isUiAutomator2 = automationName === DRIVERS.UIAUTOMATOR2;

  function addCandidate(candidate) {
    const value = typeof candidate.value === 'string' ? candidate.value.trim() : '';
    if (!value) {
      return;
    }
    candidates.push({
      label: candidate.strategy,
      sourceAttribute: null,
      sourceValue: value,
      source: 'generated',
      ...candidate,
      value,
    });
  }

  if (isNative) {
    for (const attributeName of ACCESSIBILITY_ATTRIBUTES) {
      addCandidate({
        strategy: STRATS.ACCESSIBILITY_ID,
        label: 'Accessibility ID',
        value: attributes[attributeName],
        sourceAttribute: attributeName,
        sourceValue: attributes[attributeName],
        match: {type: 'attribute', attributeName, attributeValue: attributes[attributeName]},
      });
    }

    for (const attributeName of ID_ATTRIBUTES) {
      addCandidate({
        strategy: STRATS.ID,
        label: 'ID',
        value: attributes[attributeName],
        sourceAttribute: attributeName,
        sourceValue: attributes[attributeName],
        match: {type: 'attribute', attributeName, attributeValue: attributes[attributeName]},
      });
    }

    if (isUiAutomator2) {
      for (const attributeName of ['resource-id', 'text', 'content-desc']) {
        const value = attributes[attributeName];
        const selector = value && buildUiAutomatorSelector(attributeName, value);
        addCandidate({
          strategy: STRATS.UIAUTOMATOR,
          label: 'Android UIAutomator',
          value: selector,
          sourceAttribute: attributeName,
          sourceValue: value,
          match: {type: 'attribute', attributeName, attributeValue: value},
        });
      }
    }

    for (const attributeName of TEXT_ATTRIBUTES) {
      addCandidate({
        strategy: STRATS.XPATH,
        label: attributeName === 'text' ? 'Text XPath' : `${_.startCase(attributeName)} XPath`,
        value:
          attributes[attributeName] &&
          buildAttributeXPath(attributeName, attributes[attributeName]),
        sourceAttribute: attributeName,
        sourceValue: attributes[attributeName],
        match: {type: 'xpath'},
        isTextBased: true,
      });
    }

    for (const attributeName of CLASS_ATTRIBUTES) {
      addCandidate({
        strategy: STRATS.CLASS_NAME,
        label: 'Class Name',
        value: attributes[attributeName],
        sourceAttribute: attributeName,
        sourceValue: attributes[attributeName],
        match: {type: 'attribute', attributeName, attributeValue: attributes[attributeName]},
      });
    }
  } else {
    if (attributes.id) {
      addCandidate({
        strategy: STRATS.CSS,
        label: 'CSS ID',
        value: `#${attributes.id}`,
        sourceAttribute: 'id',
        sourceValue: attributes.id,
        match: {type: 'attribute', attributeName: 'id', attributeValue: attributes.id},
      });
    }
    if (selectedElement?.tagName) {
      addCandidate({
        strategy: STRATS.TAG_NAME,
        label: 'Tag Name',
        value: selectedElement.tagName,
        sourceAttribute: 'tagName',
        match: {type: 'tag'},
      });
    }
  }

  for (const [strategy, selector] of existingStrategyMap) {
    const inferredUiAutomatorAttribute =
      strategy === STRATS.UIAUTOMATOR ? getUiAutomatorSourceAttribute(selector) : null;
    const inferredUiAutomatorValue =
      strategy === STRATS.UIAUTOMATOR ? getUiAutomatorSourceValue(selector) : null;
    addCandidate({
      strategy,
      label: labelForStrategy(strategy),
      value: selector,
      source: 'suggested',
      sourceAttribute: inferredUiAutomatorAttribute,
      sourceValue: inferredUiAutomatorValue,
      match:
        strategy === STRATS.XPATH
          ? {type: 'xpath'}
          : inferredUiAutomatorAttribute
            ? {
                type: 'attribute',
                attributeName: inferredUiAutomatorAttribute,
                attributeValue: inferredUiAutomatorValue,
              }
            : {type: 'unknown'},
    });
  }

  return mergeDuplicateCandidates(candidates);
}

/**
 * @param {string} strategy
 * @returns {string}
 */
export function labelForStrategy(strategy) {
  switch (strategy) {
    case STRATS.ACCESSIBILITY_ID:
      return 'Accessibility ID';
    case STRATS.ID:
      return 'ID';
    case STRATS.CLASS_NAME:
      return 'Class Name';
    case STRATS.XPATH:
      return 'XPath';
    case STRATS.UIAUTOMATOR:
      return 'Android UIAutomator';
    case STRATS.PREDICATE:
      return 'iOS Predicate';
    case STRATS.CLASS_CHAIN:
      return 'iOS Class Chain';
    case STRATS.CSS:
      return 'CSS';
    case STRATS.TAG_NAME:
      return 'Tag Name';
    default:
      return _.startCase(strategy);
  }
}

function mergeDuplicateCandidates(candidates) {
  const mergedCandidates = [];
  for (const candidate of candidates) {
    const existingCandidate = mergedCandidates.find(
      (item) => item.strategy === candidate.strategy && item.value === candidate.value,
    );
    if (existingCandidate) {
      existingCandidate.source =
        existingCandidate.source === 'suggested' || candidate.source === 'suggested'
          ? 'suggested'
          : existingCandidate.source;
      existingCandidate.sourceAttribute =
        existingCandidate.sourceAttribute || candidate.sourceAttribute;
      existingCandidate.sourceValue = existingCandidate.sourceValue || candidate.sourceValue;
      existingCandidate.label =
        existingCandidate.label === candidate.strategy ? candidate.label : existingCandidate.label;
      existingCandidate.isTextBased = existingCandidate.isTextBased || candidate.isTextBased;
      existingCandidate.match =
        existingCandidate.match?.type === 'unknown' ? candidate.match : existingCandidate.match;
    } else {
      mergedCandidates.push({
        key: `${candidate.strategy}:${candidate.value}`,
        ...candidate,
      });
    }
  }
  return mergedCandidates;
}
