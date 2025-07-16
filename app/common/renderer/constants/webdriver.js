export const DEFAULT_SERVER_PROPS = {
  protocol: 'http',
  hostname: '127.0.0.1',
  port: 4723,
  path: '/',
  logLevel: process.env.NODE_ENV === 'development' ? 'info' : 'warn',
};

// All properties defined on the WDIO browser object
// https://webdriver.io/docs/api/browser
export const BROWSER_PROPERTIES = [
  'capabilities',
  'requestedCapabilities',
  'sessionId',
  'options',
  'commandList',
  'isW3C',
  'isChrome',
  'isFirefox',
  'isBidi',
  'isSauce',
  'isMacApp',
  'isWindowsApp',
  'isMobile',
  'isIOS',
  'isAndroid',
  'isNativeContext',
  'mobileContext',
];

// Various protocol commands that should not be added to WDSessionDriver
export const AVOID_CMDS = [
  'newSession',
  'findElement',
  'findElements',
  'findElementFromElement',
  'findElementsFromElement',
  'executeScript',
  'executeAsyncScript',
];

// All commands defined in the webdriver protocol that are specific to a single element
// https://webdriver.io/docs/api/webdriver
export const ELEMENT_CMDS = [
  // 'findElementFromElement',  // defined as 'findElement' in WDSessionElement
  // 'findElementsFromElement', // defined as 'findElements' in WDSessionElement
  'getElementShadowRoot',
  'isElementSelected',
  'isElementDisplayed',
  'getElementAttribute',
  'getElementProperty',
  'getElementCSSValue',
  'getElementText',
  'getElementTagName',
  'getElementRect',
  'isElementEnabled',
  'elementClick',
  'elementClear',
  'elementSendKeys',
  'takeElementScreenshot',
  'getElementComputedRole',
  'getElementComputedLabel',
];
