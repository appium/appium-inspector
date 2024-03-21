export const WINDOW_DIMENSIONS = {
  MIN_WIDTH: 870,
  MIN_HEIGHT: 610,
  MAX_IMAGE_WIDTH_FRACTION: 0.4,
};

export const LINKS = {
  CREATE_ISSUE: 'https://github.com/appium/appium-inspector/issues/new/choose',
  HYBRID_MODE_DOCS: 'https://appium.github.io/appium.io/docs/en/writing-running-appium/web/hybrid/',
  CLASS_CHAIN_DOCS:
    'https://github.com/facebookarchive/WebDriverAgent/wiki/Class-Chain-Queries-Construction-Rules',
  PREDICATE_DOCS:
    'https://github.com/facebookarchive/WebDriverAgent/wiki/Predicate-Queries-Construction-Rules',
  UIAUTOMATOR_DOCS:
    'https://github.com/appium/appium-uiautomator2-driver/blob/master/docs/uiautomator-uiselector.md',
};

export const DRIVERS = {
  UIAUTOMATOR2: 'uiautomator2',
  ESPRESSO: 'espresso',
  XCUITEST: 'xcuitest',
  FLUTTER: 'flutter',
  MAC2: 'mac2',
  WINDOWS: 'windows',
  CHROMIUM: 'chromium',
  SAFARI: 'safari',
  GECKO: 'gecko',
};

export const MJPEG_STREAM_CHECK_INTERVAL = 1000;
export const SESSION_EXPIRY_PROMPT_TIMEOUT = 60 * 60 * 1000; // Give user 1 hour to reply

export const APP_MODE = {
  NATIVE: 'native',
  WEB_HYBRID: 'web_hybrid',
};

export const NATIVE_APP = 'NATIVE_APP';

export const LOCATOR_STRATEGIES = {
  ID: 'id',
  XPATH: 'xpath',
  NAME: 'name',
  CLASS_NAME: 'class name',
  ACCESSIBILITY_ID: 'accessibility id',
  PREDICATE: '-ios predicate string',
  CLASS_CHAIN: '-ios class chain',
  UIAUTOMATOR: '-android uiautomator',
  DATAMATCHER: '-android datamatcher',
  VIEWTAG: '-android viewtag',
};

// Used for a cleaner presentation in locator search modal
export const LOCATOR_STRATEGY_MAP = {
  ID: [LOCATOR_STRATEGIES.ID, 'Id'],
  XPATH: [LOCATOR_STRATEGIES.XPATH, 'XPath'],
  NAME: [LOCATOR_STRATEGIES.NAME, 'Name'],
  CLASS_NAME: [LOCATOR_STRATEGIES.CLASS_NAME, 'Class Name'],
  ACCESSIBILITY_ID: [LOCATOR_STRATEGIES.ACCESSIBILITY_ID, 'Accessibility ID'],
  PREDICATE: [LOCATOR_STRATEGIES.PREDICATE, 'Predicate String'],
  CLASS_CHAIN: [LOCATOR_STRATEGIES.CLASS_CHAIN, 'Class Chain'],
  UIAUTOMATOR: [LOCATOR_STRATEGIES.UIAUTOMATOR, 'UIAutomator'],
  DATAMATCHER: [LOCATOR_STRATEGIES.DATAMATCHER, 'DataMatcher'],
  VIEWTAG: [LOCATOR_STRATEGIES.VIEWTAG, 'View Tag'],
};

export const INSPECTOR_TABS = {
  SOURCE: 'source',
  COMMANDS: 'commands',
  GESTURES: 'gestures',
  RECORDER: 'recorder',
  SESSION_INFO: 'sessionInfo',
};
