import _ from 'lodash';

import {LOCATOR_STRATEGIES as STRATS} from '../../constants/session-inspector.js';

const PYTHON_BY = {
  [STRATS.XPATH]: 'AppiumBy.XPATH',
  [STRATS.ACCESSIBILITY_ID]: 'AppiumBy.ACCESSIBILITY_ID',
  [STRATS.ID]: 'AppiumBy.ID',
  [STRATS.CLASS_NAME]: 'AppiumBy.CLASS_NAME',
  [STRATS.NAME]: 'AppiumBy.NAME',
  [STRATS.UIAUTOMATOR]: 'AppiumBy.ANDROID_UIAUTOMATOR',
  [STRATS.PREDICATE]: 'AppiumBy.IOS_PREDICATE',
  [STRATS.CLASS_CHAIN]: 'AppiumBy.IOS_CLASS_CHAIN',
  [STRATS.CSS]: 'AppiumBy.CSS_SELECTOR',
  [STRATS.TAG_NAME]: 'AppiumBy.TAG_NAME',
};

const JAVA_BY = {
  [STRATS.XPATH]: 'xpath',
  [STRATS.ACCESSIBILITY_ID]: 'accessibilityId',
  [STRATS.ID]: 'id',
  [STRATS.CLASS_NAME]: 'className',
  [STRATS.NAME]: 'name',
  [STRATS.UIAUTOMATOR]: 'androidUIAutomator',
  [STRATS.PREDICATE]: 'iOSNsPredicateString',
  [STRATS.CLASS_CHAIN]: 'iOSClassChain',
  [STRATS.CSS]: 'cssSelector',
  [STRATS.TAG_NAME]: 'tagName',
};

const APPIUM_BY_LABEL = {
  [STRATS.XPATH]: 'XPATH',
  [STRATS.ACCESSIBILITY_ID]: 'ACCESSIBILITY_ID',
  [STRATS.ID]: 'ID',
  [STRATS.CLASS_NAME]: 'CLASS_NAME',
  [STRATS.NAME]: 'NAME',
  [STRATS.UIAUTOMATOR]: 'ANDROID_UIAUTOMATOR',
  [STRATS.PREDICATE]: 'IOS_PREDICATE',
  [STRATS.CLASS_CHAIN]: 'IOS_CLASS_CHAIN',
  [STRATS.CSS]: 'CSS_SELECTOR',
  [STRATS.TAG_NAME]: 'TAG_NAME',
};

/**
 * @param {object} locator
 * @returns {Record<string, string>}
 */
export function getLocatorCodeSamples(locator) {
  return {
    python: getPythonCode(locator),
    java: getJavaCode(locator),
    javascript: getJavaScriptCode(locator),
  };
}

/**
 * @param {object} locator
 * @returns {string}
 */
export function formatLocatorForAppiumBy(locator) {
  const byLabel = APPIUM_BY_LABEL[locator.strategy];
  if (!byLabel) {
    return `${locator.strategy}: ${locator.value}`;
  }
  return `AppiumBy.${byLabel}(${JSON.stringify(locator.value)})`;
}

/**
 * @param {string} language
 * @returns {string}
 */
export function getReadableCodeLanguage(language) {
  return language === 'javascript' ? 'JavaScript' : _.startCase(language);
}

function getPythonCode(locator) {
  const by = PYTHON_BY[locator.strategy];
  if (!by) {
    return `# Unsupported locator strategy: ${locator.strategy}`;
  }
  return `driver.find_element(${by}, ${JSON.stringify(locator.value)}).click()`;
}

function getJavaCode(locator) {
  const by = JAVA_BY[locator.strategy];
  if (!by) {
    return `// Unsupported locator strategy: ${locator.strategy}`;
  }
  return `driver.findElement(AppiumBy.${by}(${JSON.stringify(locator.value)})).click();`;
}

function getJavaScriptCode(locator) {
  return `await driver.$(${JSON.stringify(getWebdriverIoSelector(locator))}).click();`;
}

function getWebdriverIoSelector(locator) {
  switch (locator.strategy) {
    case STRATS.XPATH:
      return locator.value;
    case STRATS.ACCESSIBILITY_ID:
      return `~${locator.value}`;
    case STRATS.ID:
      return `id=${locator.value}`;
    case STRATS.UIAUTOMATOR:
      return `android=${locator.value}`;
    case STRATS.PREDICATE:
      return `-ios predicate string:${locator.value}`;
    case STRATS.CLASS_CHAIN:
      return `-ios class chain:${locator.value}`;
    case STRATS.CSS:
      return locator.value;
    default:
      return `${locator.strategy}:${locator.value}`;
  }
}
