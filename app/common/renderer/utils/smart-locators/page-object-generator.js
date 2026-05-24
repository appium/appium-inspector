import _ from 'lodash';

import {LOCATOR_STRATEGIES as STRATS} from '../../constants/session-inspector.js';

/**
 * Generate a small Page Object skeleton from a ranked locator.
 *
 * @param {object} params
 * @param {object} params.locator
 * @param {object} params.selectedElement
 * @param {string} params.language
 * @returns {string}
 */
export function generatePageObject({locator, selectedElement, language}) {
  const names = getElementNames(selectedElement, locator);
  switch (language) {
    case 'java':
      return generateJavaPageObject(locator, names);
    case 'javascript':
      return generateJavaScriptPageObject(locator, names);
    default:
      return generatePythonPageObject(locator, names);
  }
}

function generatePythonPageObject(locator, names) {
  return `from appium.webdriver.common.appiumby import AppiumBy


class ${names.className}:
    ${names.constantName} = (${getPythonBy(locator.strategy)}, ${JSON.stringify(locator.value)})

    def __init__(self, driver):
        self.driver = driver

    def tap_${names.methodName}(self):
        self.driver.find_element(*self.${names.constantName}).click()
`;
}

function generateJavaPageObject(locator, names) {
  return `import io.appium.java_client.AppiumBy;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class ${names.className} {
    private final WebDriver driver;
    private final By ${names.fieldName} = AppiumBy.${getJavaBy(locator.strategy)}(${JSON.stringify(
      locator.value,
    )});

    public ${names.className}(WebDriver driver) {
        this.driver = driver;
    }

    public void tap${names.pascalName}() {
        driver.findElement(${names.fieldName}).click();
    }
}
`;
}

function generateJavaScriptPageObject(locator, names) {
  return `class ${names.className} {
  constructor(driver) {
    this.driver = driver;
  }

  get ${names.fieldName}() {
    return this.driver.$(${JSON.stringify(getWebdriverIoSelector(locator))});
  }

  async tap${names.pascalName}() {
    await (await this.${names.fieldName}).click();
  }
}

export default ${names.className};
`;
}

function getElementNames(selectedElement, locator) {
  const attrs = selectedElement?.attributes || {};
  const rawName =
    attrs['resource-id'] ||
    attrs.id ||
    attrs['content-desc'] ||
    attrs.name ||
    attrs.text ||
    locator.value ||
    'selected element';
  const baseName = toSnakeCase(rawName.split(/[:/.]/).at(-1));
  const safeName = baseName || 'selected_element';
  const pascalName = _.upperFirst(_.camelCase(safeName));
  return {
    className: `${pascalName}Page`,
    constantName: safeName.toUpperCase(),
    fieldName: _.camelCase(safeName),
    methodName: safeName,
    pascalName,
  };
}

function getPythonBy(strategy) {
  return {
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
  }[strategy];
}

function getJavaBy(strategy) {
  return {
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
  }[strategy];
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

function toSnakeCase(value) {
  return String(value || '')
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}
