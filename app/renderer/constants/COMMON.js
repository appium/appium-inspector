export const APP_MODE = {
  NATIVE: 'native',
  WEB_HYBRID: 'web_hybrid',
};

export const NATIVE_APP = 'NATIVE_APP';

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
