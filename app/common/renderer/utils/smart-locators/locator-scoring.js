import XPath from 'xpath';

import {LOCATOR_STRATEGIES as STRATS} from '../../constants/session-inspector.js';
import {xmlToDOM} from '../source-parsing.js';
import {formatLocatorForAppiumBy, getLocatorCodeSamples} from './locator-code-sample.js';
import {generateSmartLocatorCandidates} from './locator-generator.js';

const MAX_SCORE = 100;
const MIN_SCORE = 0;
const LONG_XPATH_LENGTH = 80;

const COMMON_CLASS_NAMES = [
  'android.widget.button',
  'android.widget.textview',
  'android.widget.edittext',
  'android.widget.imageview',
  'android.view.view',
  'android.view.viewgroup',
  'android.widget.linearlayout',
  'android.widget.framelayout',
  'android.widget.recyclerview',
  'xcuielementtypebutton',
  'xcuielementtypestatictext',
  'xcuielementtypecell',
  'xcuielementtypeother',
  'xcuielementtypeimage',
  'xcuielementtypetextfield',
  'div',
  'span',
  'button',
  'input',
];

const TEXT_ATTRIBUTES = ['text', 'label', 'value'];

/**
 * Rank locator candidates for the selected element.
 *
 * @param {object} params
 * @param {object} params.selectedElement
 * @param {string} params.sourceXML
 * @param {string} [params.currentContext]
 * @param {string} [params.automationName]
 * @returns {Array<object>}
 */
export function rankSmartLocators({
  selectedElement,
  sourceXML,
  currentContext,
  automationName,
  runtimeValidationResults = {},
}) {
  const sourceDoc = sourceXML ? xmlToDOM(sourceXML) : null;
  const rankedLocators = generateSmartLocatorCandidates(selectedElement, {
    currentContext,
    automationName,
  })
    .map((candidate) =>
      scoreSmartLocator(candidate, {
        selectedElement,
        sourceDoc,
      }),
    )
    .map((locator) => applyRuntimeValidationResult(locator, runtimeValidationResults[locator.key]))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      if ((left.matchCount ?? Infinity) !== (right.matchCount ?? Infinity)) {
        return (left.matchCount ?? Infinity) - (right.matchCount ?? Infinity);
      }
      return getStrategyPriority(left.strategy) - getStrategyPriority(right.strategy);
    });
  return rankedLocators.map((locator, index) => ({
    ...locator,
    rank: index + 1,
  }));
}

/**
 * Score one locator candidate.
 *
 * @param {object} candidate
 * @param {object} options
 * @param {object} options.selectedElement
 * @param {Document|null} options.sourceDoc
 * @returns {object}
 */
export function scoreSmartLocator(candidate, {selectedElement, sourceDoc} = {}) {
  const reasons = [];
  const warnings = [];
  const matchCount = getSmartLocatorMatchCount(candidate, sourceDoc);
  let score = getBaseScore(candidate, reasons, warnings);

  if (matchCount === 1) {
    score += 20;
    reasons.push('Unique on the current screen.');
  } else if (matchCount > 1) {
    score -= 40;
    warnings.push(`Matches ${matchCount} elements on the current screen.`);
  } else if (matchCount === 0) {
    score -= 50;
    warnings.push('Does not match any element in the current source.');
  }

  applyLocatorSpecificRules(candidate, reasons, warnings, (delta) => {
    score += delta;
  });
  applyElementStateWarnings(selectedElement, warnings);

  const finalScore = clampScore(score);
  return {
    ...candidate,
    score: finalScore,
    matchCount,
    reasons: dedupeMessages(reasons),
    warnings: dedupeMessages(warnings),
    status: getLocatorStatus(finalScore, matchCount),
    formattedLocator: formatLocatorForAppiumBy(candidate),
    codeSamples: getLocatorCodeSamples(candidate),
  };
}

/**
 * Count matches for a candidate using the current XML source.
 *
 * @param {object} candidate
 * @param {Document|string|null} sourceDocOrXML
 * @returns {number|null}
 */
export function getSmartLocatorMatchCount(candidate, sourceDocOrXML) {
  if (!sourceDocOrXML) {
    return null;
  }
  const sourceDoc = typeof sourceDocOrXML === 'string' ? xmlToDOM(sourceDocOrXML) : sourceDocOrXML;

  try {
    switch (candidate.match?.type) {
      case 'attribute':
        return countAttributeMatches(
          candidate.match.attributeName,
          candidate.match.attributeValue ?? candidate.sourceValue ?? candidate.value,
          sourceDoc,
        );
      case 'tag':
        return countTagMatches(candidate.value, sourceDoc);
      case 'xpath':
        return XPath.select(candidate.value, sourceDoc).length;
      default:
        return inferMatchCount(candidate, sourceDoc);
    }
  } catch {
    return 0;
  }
}

/**
 * @param {object} candidate
 * @param {string[]} reasons
 * @param {string[]} warnings
 * @returns {number}
 */
export function getBaseScore(candidate, reasons = [], warnings = []) {
  switch (candidate.strategy) {
    case STRATS.ACCESSIBILITY_ID:
      reasons.push(
        'Accessibility ID is intended for automation and usually survives layout changes.',
      );
      return 100;
    case STRATS.ID:
      reasons.push('Resource ID is readable and usually stable.');
      return 90;
    case STRATS.CSS:
      reasons.push('CSS ID selectors are concise in web contexts.');
      return 85;
    case STRATS.PREDICATE:
      reasons.push(
        'iOS predicate locators are expressive and usually shorter than hierarchy XPath.',
      );
      return 75;
    case STRATS.UIAUTOMATOR:
      reasons.push('Android UIAutomator is expressive for Android screens.');
      return 70;
    case STRATS.CLASS_CHAIN:
      reasons.push(
        'iOS class chain is faster than many XPath locators but can still depend on hierarchy.',
      );
      return 70;
    case STRATS.NAME:
      reasons.push('Name locators are readable, but may be reused by multiple elements.');
      return 65;
    case STRATS.XPATH:
      if (candidate.isTextBased || TEXT_ATTRIBUTES.includes(candidate.sourceAttribute)) {
        reasons.push('Text-based XPath is readable for humans.');
        warnings.push('Text can change with localization, copy edits, or dynamic content.');
        return 60;
      }
      warnings.push('XPath can break when the UI hierarchy changes.');
      return candidate.value.length > LONG_XPATH_LENGTH ? 10 : 30;
    case STRATS.CLASS_NAME:
      warnings.push('Class name is usually shared by many elements.');
      return 40;
    case STRATS.TAG_NAME:
      warnings.push('Tag name is broad and rarely identifies one element by itself.');
      return 25;
    default:
      warnings.push('This locator strategy has limited ranking rules.');
      return 50;
  }
}

/**
 * @param {number} score
 * @param {number|null} matchCount
 * @returns {string}
 */
export function getLocatorStatus(score, matchCount) {
  if (matchCount === 0) {
    return 'Invalid';
  }
  if (score >= 85) {
    return 'Recommended';
  }
  if (score >= 70) {
    return 'Good';
  }
  if (score >= 45) {
    return 'Medium';
  }
  return 'Weak';
}

/**
 * @param {string} value
 * @returns {boolean}
 */
export function looksDynamicText(value) {
  const text = String(value || '').trim();
  return (
    /^[$€£¥]?\s*\d+([.,]\d+)*\s*%?$/.test(text) ||
    /\b\d{1,2}[:/.-]\d{1,2}([:/.-]\d{2,4})?\b/.test(text) ||
    /\b\d+\s*(items?|results?|seconds?|minutes?|hours?)\b/i.test(text)
  );
}

/**
 * Apply runtime validation results from a real Appium findElements call.
 *
 * @param {object} locator
 * @param {object} runtimeResult
 * @returns {object}
 */
export function applyRuntimeValidationResult(locator, runtimeResult) {
  if (!runtimeResult) {
    return locator;
  }

  const reasons = [...locator.reasons];
  const warnings = [...locator.warnings];
  let score = locator.score;

  if (runtimeResult.error) {
    score -= 50;
    warnings.push(`Runtime validation failed: ${runtimeResult.error}`);
  } else {
    if (runtimeResult.matchCount === 1) {
      score += 10;
      reasons.push('Appium runtime validation found exactly one element.');
    } else if (runtimeResult.matchCount > 1) {
      score -= 30;
      warnings.push(`Appium runtime validation matched ${runtimeResult.matchCount} elements.`);
    } else {
      score -= 50;
      warnings.push('Appium runtime validation did not find this locator.');
    }

    if (runtimeResult.matchesSelectedElement === true) {
      score += 10;
      reasons.push('Runtime result matches the selected element.');
    } else if (runtimeResult.matchesSelectedElement === false) {
      score -= 40;
      warnings.push('Runtime result does not match the selected element.');
    }

    if (runtimeResult.executionTime >= 500) {
      score -= 10;
      warnings.push(`Runtime lookup is slow (${runtimeResult.executionTime} ms).`);
    } else if (runtimeResult.executionTime !== null && runtimeResult.executionTime <= 100) {
      reasons.push(`Runtime lookup is fast (${runtimeResult.executionTime} ms).`);
    }
  }

  const finalScore = clampScore(score);
  return {
    ...locator,
    score: finalScore,
    reasons: dedupeMessages(reasons),
    warnings: dedupeMessages(warnings),
    status: getRuntimeAwareStatus(finalScore, runtimeResult),
    runtime: runtimeResult,
  };
}

function applyLocatorSpecificRules(candidate, reasons, warnings, adjustScore) {
  if (candidate.strategy === STRATS.XPATH && candidate.value.length > LONG_XPATH_LENGTH) {
    adjustScore(-20);
    warnings.push('XPath is longer than 80 characters and is likely fragile.');
  }

  if (candidate.strategy === STRATS.XPATH && /\/hierarchy\//.test(candidate.value)) {
    adjustScore(-10);
    warnings.push('Hierarchy XPath depends on the exact screen structure.');
  }

  if (
    TEXT_ATTRIBUTES.includes(candidate.sourceAttribute) &&
    looksDynamicText(candidate.sourceValue ?? candidate.value)
  ) {
    adjustScore(-20);
    warnings.push('The locator value looks dynamic.');
  }

  if (candidate.isTextBased && looksDynamicText(extractTextLiteralFromXPath(candidate.value))) {
    adjustScore(-20);
    warnings.push('The text value looks dynamic.');
  }

  if (candidate.strategy === STRATS.CLASS_NAME && isCommonClassName(candidate.value)) {
    adjustScore(-20);
    warnings.push('This class name is common and not specific enough.');
  }

  if (candidate.strategy === STRATS.UIAUTOMATOR && /\.instance\(\d+\)/.test(candidate.value)) {
    adjustScore(-15);
    warnings.push('Uses an instance index, so it may break if similar elements are reordered.');
  }

  if (candidate.source === 'suggested') {
    reasons.push('Already available in Appium Inspector suggested locators.');
  }
}

function getRuntimeAwareStatus(score, runtimeResult) {
  if (runtimeResult?.error || runtimeResult?.matchCount === 0) {
    return 'Invalid';
  }
  if (runtimeResult?.matchesSelectedElement === false) {
    return score >= 45 ? 'Medium' : 'Weak';
  }
  return getLocatorStatus(score, runtimeResult?.matchCount);
}

function applyElementStateWarnings(selectedElement, warnings) {
  const attributes = selectedElement?.attributes || {};
  if (attributes.enabled === 'false') {
    warnings.push('Element is currently disabled.');
  }
  if (attributes.displayed === 'false' || attributes.visible === 'false') {
    warnings.push('Element is not currently displayed.');
  }
}

function inferMatchCount(candidate, sourceDoc) {
  if (candidate.strategy === STRATS.XPATH) {
    return XPath.select(candidate.value, sourceDoc).length;
  }
  if (candidate.strategy === STRATS.CSS && candidate.value.startsWith('#')) {
    return countAttributeMatches('id', candidate.value.slice(1), sourceDoc);
  }
  return null;
}

function countAttributeMatches(attributeName, attributeValue, sourceDoc) {
  if (!attributeName || !attributeValue) {
    return 0;
  }
  const parsedXPath = XPath.parse(`//*[@${attributeName}=$attributeValue]`);
  return parsedXPath.select({node: sourceDoc, variables: {attributeValue}}).length;
}

function countTagMatches(tagName, sourceDoc) {
  if (!tagName) {
    return 0;
  }
  const parsedXPath = XPath.parse('//*[name()=$tagName]');
  return parsedXPath.select({node: sourceDoc, variables: {tagName}}).length;
}

function isCommonClassName(value) {
  return COMMON_CLASS_NAMES.includes(String(value || '').toLowerCase());
}

function extractTextLiteralFromXPath(xpath) {
  const match = String(xpath).match(/@(?:text|label|value)=(['"])(.*?)\1/);
  return match ? match[2] : '';
}

function clampScore(score) {
  return Math.max(MIN_SCORE, Math.min(MAX_SCORE, score));
}

function dedupeMessages(messages) {
  return [...new Set(messages)];
}

function getStrategyPriority(strategy) {
  const priority = [
    STRATS.ACCESSIBILITY_ID,
    STRATS.ID,
    STRATS.CSS,
    STRATS.PREDICATE,
    STRATS.UIAUTOMATOR,
    STRATS.CLASS_CHAIN,
    STRATS.NAME,
    STRATS.XPATH,
    STRATS.CLASS_NAME,
    STRATS.TAG_NAME,
  ];
  const index = priority.indexOf(strategy);
  return index === -1 ? priority.length : index;
}
