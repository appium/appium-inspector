export const MJPEG_STREAM_CHECK_INTERVAL = 1000;
export const SESSION_EXPIRY_PROMPT_TIMEOUT = 60 * 60 * 1000; // Give user 1 hour to reply
export const REFRESH_DELAY_MILLIS = 500;

export const APP_MODE = {
  NATIVE: 'native',
  WEB_HYBRID: 'web_hybrid',
};

export const NATIVE_APP = 'NATIVE_APP';

export const UNKNOWN_ERROR = 'unknown error';
export const SESSION_EXPIRED = 'Session Expired';

export const LOCATOR_STRATEGIES = {
  ID: 'id',
  XPATH: 'xpath',
  NAME: 'name',
  CLASS_NAME: 'class name',
  ACCESSIBILITY_ID: 'accessibility id',
  // Web context-specific
  CSS: 'css selector',
  LINK_TEXT: 'link text',
  PARTIAL_LINK_TEXT: 'partial link text',
  TAG_NAME: 'tag name',
  // Driver-specific
  PREDICATE: '-ios predicate string',
  CLASS_CHAIN: '-ios class chain',
  UIAUTOMATOR: '-android uiautomator',
  DATAMATCHER: '-android datamatcher',
  VIEWTAG: '-android viewtag',
};

export const NATIVE_COMMON_LOCATOR_STRATEGY_MAP = {
  ID: [LOCATOR_STRATEGIES.ID, 'Id'],
  XPATH: [LOCATOR_STRATEGIES.XPATH, 'XPath'],
  NAME: [LOCATOR_STRATEGIES.NAME, 'Name'],
  CLASS_NAME: [LOCATOR_STRATEGIES.CLASS_NAME, 'Class Name'],
  ACCESSIBILITY_ID: [LOCATOR_STRATEGIES.ACCESSIBILITY_ID, 'Accessibility ID'],
};

export const WEB_LOCATOR_STRATEGY_MAP = {
  CSS: [LOCATOR_STRATEGIES.CSS, 'CSS'],
  XPATH: [LOCATOR_STRATEGIES.XPATH, 'XPath'],
  LINK_TEXT: [LOCATOR_STRATEGIES.LINK_TEXT, 'Link Text'],
  PARTIAL_LINK_TEXT: [LOCATOR_STRATEGIES.PARTIAL_LINK_TEXT, 'Partial Link Text'],
  TAG_NAME: [LOCATOR_STRATEGIES.TAG_NAME, 'Tag Name'],
};

export const NATIVE_DRIVER_LOCATOR_STRATEGY_MAP = {
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

export const CLIENT_FRAMEWORKS = {
  DOTNET_NUNIT: 'dotNetNUnit',
  JS_WDIO: 'jsWdIo',
  JS_OXYGEN: 'jsOxygen',
  JAVA_JUNIT4: 'java', // historical
  JAVA_JUNIT5: 'javaJUnit5',
  PYTHON: 'python',
  ROBOT: 'robot',
  RUBY: 'ruby',
};
