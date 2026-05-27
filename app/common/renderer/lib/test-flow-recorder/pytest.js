import {normalizeTestFlowStepDelayMs} from './common.js';

const APPIUM_BY_MAP = {
  id: 'AppiumBy.ID',
  xpath: 'AppiumBy.XPATH',
  name: 'AppiumBy.NAME',
  'class name': 'AppiumBy.CLASS_NAME',
  'accessibility id': 'AppiumBy.ACCESSIBILITY_ID',
  'css selector': 'AppiumBy.CSS_SELECTOR',
  'link text': 'AppiumBy.LINK_TEXT',
  'partial link text': 'AppiumBy.PARTIAL_LINK_TEXT',
  'tag name': 'AppiumBy.TAG_NAME',
  '-ios predicate string': 'AppiumBy.IOS_PREDICATE',
  '-ios class chain': 'AppiumBy.IOS_CLASS_CHAIN',
  '-android uiautomator': 'AppiumBy.ANDROID_UIAUTOMATOR',
  '-android datamatcher': 'AppiumBy.ANDROID_DATA_MATCHER',
  '-android viewtag': 'AppiumBy.ANDROID_VIEWTAG',
};

export function getPytestTestFlowCode({serverUrl, sessionCaps, steps = [], stepDelayMs}) {
  const resolvedServerUrl = serverUrl || 'http://127.0.0.1:4723';
  const normalizedStepDelayMs = normalizeTestFlowStepDelayMs(stepDelayMs);
  const shouldImportTime = normalizedStepDelayMs > 0 && hasSequentialSteps(steps);
  const stepLines = steps.length
    ? getStepSequenceLines(steps, 2, normalizedStepDelayMs, true)
    : ['        # Start recording to generate a flow here'];

  return [
    ...(shouldImportTime ? ['import time'] : []),
    'import pytest',
    'from appium import webdriver',
    'from appium.options.common import AppiumOptions',
    'from appium.webdriver.common.appiumby import AppiumBy',
    'from selenium.webdriver.common.action_chains import ActionChains',
    'from selenium.webdriver.common.actions import interaction',
    'from selenium.webdriver.common.actions.action_builder import ActionBuilder',
    'from selenium.webdriver.common.actions.pointer_input import PointerInput',
    '',
    '',
    'def create_driver():',
    '    options = AppiumOptions()',
    `    options.load_capabilities(${toPythonLiteral(sessionCaps || {}, 1)})`,
    `    return webdriver.Remote(${toPythonLiteral(resolvedServerUrl)}, options=options)`,
    '',
    '',
    '@pytest.mark.smoke',
    'def test_recorded_flow():',
    '    driver = create_driver()',
    '    try:',
    ...stepLines,
    '    finally:',
    '        driver.quit()',
    '',
  ].join('\n');
}

function toPythonLiteral(value, indentLevel = 0) {
  const indent = ' '.repeat(indentLevel * 4);
  const nextIndent = ' '.repeat((indentLevel + 1) * 4);

  if (value === null || value === undefined) {
    return 'None';
  }

  if (typeof value === 'string') {
    return JSON.stringify(value);
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'True' : 'False';
  }

  if (Array.isArray(value)) {
    if (!value.length) {
      return '[]';
    }

    return (
      `[` +
      `\n${value.map((item) => `${nextIndent}${toPythonLiteral(item, indentLevel + 1)}`).join(',\n')}` +
      `\n${indent}]`
    );
  }

  const entries = Object.entries(value);
  if (!entries.length) {
    return '{}';
  }

  return (
    `{` +
    `\n${entries
      .map(
        ([key, itemValue]) =>
          `${nextIndent}${JSON.stringify(key)}: ${toPythonLiteral(itemValue, indentLevel + 1)}`,
      )
      .join(',\n')}` +
    `\n${indent}}`
  );
}

function getLocatorBy(locator) {
  return APPIUM_BY_MAP[locator?.strategy] || 'AppiumBy.XPATH';
}

function getFindExpression(locator, plural = false) {
  if (!locator?.strategy || !locator?.value) {
    return null;
  }

  const by = getLocatorBy(locator);
  const command = plural ? 'find_elements' : 'find_element';
  return `driver.${command}(${by}, ${toPythonLiteral(locator.value)})`;
}

function withIndent(lines, indentLevel) {
  const indent = ' '.repeat(indentLevel * 4);
  return lines.map((line) => `${indent}${line}`);
}

function formatDelaySeconds(stepDelayMs) {
  const seconds = (stepDelayMs / 1000).toFixed(3);
  return seconds.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
}

function hasSequentialSteps(steps = []) {
  if (steps.length > 1) {
    return true;
  }

  return steps.some(
    (step) =>
      step.type === 'branch' &&
      (hasSequentialSteps(step.thenSteps || []) || hasSequentialSteps(step.elseSteps || [])),
  );
}

function getStepSequenceLines(steps, indentLevel, stepDelayMs, includeHeaders = false) {
  return steps.flatMap((step, index) => {
    const lines = [];

    if (includeHeaders) {
      lines.push(
        ...withIndent([`# [Step ${index + 1}] ${step.name || step.type || 'Step'}`], indentLevel),
      );
    }

    lines.push(...getStepLines(step, indentLevel, stepDelayMs));

    if (stepDelayMs > 0 && index < steps.length - 1) {
      lines.push(...withIndent([`time.sleep(${formatDelaySeconds(stepDelayMs)})`], indentLevel));
    }

    return lines;
  });
}

function getScrollRatios(direction = 'down') {
  switch (direction) {
    case 'up':
      return {
        startX: 0.5,
        startY: 0.3,
        endX: 0.5,
        endY: 0.75,
      };

    case 'left':
      return {
        startX: 0.25,
        startY: 0.5,
        endX: 0.8,
        endY: 0.5,
      };

    case 'right':
      return {
        startX: 0.8,
        startY: 0.5,
        endX: 0.25,
        endY: 0.5,
      };

    case 'down':
    default:
      return {
        startX: 0.5,
        startY: 0.75,
        endX: 0.5,
        endY: 0.3,
      };
  }
}

function getActionLines(step, indentLevel) {
  const findExpression = getFindExpression(step.locator);

  switch (step.action) {
    case 'tap':
      return findExpression
        ? withIndent([`${findExpression}.click()`], indentLevel)
        : withIndent(['# TODO: add a locator for this tap step'], indentLevel);

    case 'sendKeys':
      return findExpression
        ? withIndent(
            [
              `element = ${findExpression}`,
              `element.send_keys(${toPythonLiteral(step.value || '')})`,
            ],
            indentLevel,
          )
        : withIndent(['# TODO: add a locator for this send keys step'], indentLevel);

    case 'clear':
      return findExpression
        ? withIndent([`${findExpression}.clear()`], indentLevel)
        : withIndent(['# TODO: add a locator for this clear step'], indentLevel);

    case 'scrollViewport': {
      const ratios = getScrollRatios(step.direction);
      return withIndent(
        [
          'window_rect = driver.get_window_rect()',
          `start_x = int(window_rect["width"] * ${ratios.startX})`,
          `start_y = int(window_rect["height"] * ${ratios.startY})`,
          `end_x = int(window_rect["width"] * ${ratios.endX})`,
          `end_y = int(window_rect["height"] * ${ratios.endY})`,
          'actions = ActionChains(driver)',
          'actions.w3c_actions = ActionBuilder(driver, mouse=PointerInput(interaction.POINTER_TOUCH, "touch"))',
          'actions.w3c_actions.pointer_action.move_to_location(start_x, start_y)',
          'actions.w3c_actions.pointer_action.pointer_down()',
          'actions.w3c_actions.pointer_action.pause(0.2)',
          'actions.w3c_actions.pointer_action.move_to_location(end_x, end_y)',
          'actions.w3c_actions.pointer_action.release()',
          'actions.perform()',
        ],
        indentLevel,
      );
    }

    case 'back':
    case 'pressBack':
      return withIndent(['driver.back()'], indentLevel);

    case 'pressHome':
      return withIndent(
        ['driver.execute_script("mobile: pressButton", {"name": "home"})'],
        indentLevel,
      );

    case 'openAppSwitcher':
      return withIndent(
        ['driver.execute_script("mobile: pressKey", {"keycode": 187})'],
        indentLevel,
      );

    default:
      return withIndent(
        [`# TODO: implement recorded action '${step.action || 'custom'}'`],
        indentLevel,
      );
  }
}

function getAssertionLines(step, indentLevel) {
  const findExpression = getFindExpression(step.locator);
  const pluralFindExpression = getFindExpression(step.locator, true);

  if (!findExpression && !pluralFindExpression) {
    return withIndent(['# TODO: add a locator for this assertion'], indentLevel);
  }

  switch (step.assertion) {
    case 'exists':
      return withIndent(
        [`assert ${pluralFindExpression}, "Expected element to exist"`],
        indentLevel,
      );

    case 'visible':
      return withIndent(
        [`assert ${findExpression}.is_displayed(), "Expected element to be visible"`],
        indentLevel,
      );

    case 'enabled':
      return withIndent(
        [`assert ${findExpression}.is_enabled(), "Expected element to be enabled"`],
        indentLevel,
      );

    case 'disabled':
      return withIndent(
        [`assert not ${findExpression}.is_enabled(), "Expected element to be disabled"`],
        indentLevel,
      );

    case 'textEquals':
      return withIndent(
        [
          `assert ${findExpression}.text == ${toPythonLiteral(step.expectedText || '')}, "Expected element text to match"`,
        ],
        indentLevel,
      );

    case 'attributeEquals':
      return withIndent(
        [
          `assert ${findExpression}.get_attribute(${toPythonLiteral(step.attributeName || '')}) == ${toPythonLiteral(step.expectedValue || '')}, "Expected attribute value to match"`,
        ],
        indentLevel,
      );

    default:
      return withIndent(
        [`# TODO: implement assertion '${step.assertion || 'exists'}'`],
        indentLevel,
      );
  }
}

function getBranchLines(step, indentLevel, stepDelayMs) {
  const conditionLocator = step.condition?.locator || step.locator;
  const conditionType = step.condition?.assertion || 'exists';
  const conditionExpression = getFindExpression(conditionLocator, true);
  const singleConditionExpression = getFindExpression(conditionLocator);

  if (!conditionExpression) {
    return withIndent(['# TODO: define a supported branch condition'], indentLevel);
  }

  let conditionLine;
  if (conditionType === 'exists') {
    conditionLine = `if ${conditionExpression}:`;
  } else if (conditionType === 'visible' && singleConditionExpression) {
    conditionLine = `if ${conditionExpression} and ${singleConditionExpression}.is_displayed():`;
  } else {
    return withIndent(['# TODO: define a supported branch condition'], indentLevel);
  }

  const lines = withIndent([conditionLine], indentLevel);
  const thenSteps = step.thenSteps?.length ? step.thenSteps : [{type: 'action', action: 'custom'}];
  const elseSteps = step.elseSteps?.length ? step.elseSteps : [{type: 'action', action: 'custom'}];

  lines.push(...getStepSequenceLines(thenSteps, indentLevel + 1, stepDelayMs));

  lines.push(...withIndent(['else:'], indentLevel));
  lines.push(...getStepSequenceLines(elseSteps, indentLevel + 1, stepDelayMs));

  return lines;
}

function getStepLines(step, indentLevel = 2, stepDelayMs = 0) {
  if (step.type === 'assertion') {
    return getAssertionLines(step, indentLevel);
  }

  if (step.type === 'branch') {
    return getBranchLines(step, indentLevel, stepDelayMs);
  }

  return getActionLines(step, indentLevel);
}
