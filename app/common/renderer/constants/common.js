export const WINDOW_DIMENSIONS = {
  MIN_WIDTH: 870,
  MIN_HEIGHT: 610,
  MAX_IMAGE_WIDTH_FRACTION: 0.4,
};

export const LINKS = {
  CREATE_ISSUE: 'https://github.com/appium/appium-inspector/issues/new/choose',
  CAPS_DOCS: 'https://appium.io/docs/en/latest/guides/caps/',
  ADD_CAPS_DOCS:
    'https://appium.github.io/appium-inspector/latest/quickstart/starting-a-session/#adding-session-details',
  HYBRID_MODE_DOCS: 'https://appium.github.io/appium.io/docs/en/writing-running-appium/web/hybrid/',
  CLASS_CHAIN_DOCS: 'https://github.com/facebookarchive/WebDriverAgent/wiki/Class-Chain-Queries-Construction-Rules',
  PREDICATE_DOCS: 'https://github.com/facebookarchive/WebDriverAgent/wiki/Predicate-Queries-Construction-Rules',
  UIAUTOMATOR_DOCS: 'https://github.com/appium/appium-uiautomator2-driver/blob/master/docs/uiautomator-uiselector.md',
};

// Known values of 'automationName'
export const DRIVERS = {
  UIAUTOMATOR2: 'uiautomator2',
  ESPRESSO: 'espresso',
  COMPOSE: 'compose', // subdriver of the Espresso driver
  XCUITEST: 'xcuitest',
  FLUTTER: 'flutter',
  MAC2: 'mac2',
  WINDOWS: 'windows',
  CHROMIUM: 'chromium',
  SAFARI: 'safari',
  GECKO: 'gecko',
};

// Known values of 'platformName'
export const PLATFORMS = {
  ANDROID: 'android',
  IOS: 'ios',
  TVOS: 'tvos',
  WATCHOS: 'watchos',
  MACOS: 'mac',
  WINDOWS: 'windows',
  LINUX: 'linux',
};

// Certain platforms do not support W3C Actions - disable tap/swipe features on those
export const PLATFORMS_WITHOUT_W3C_ACTIONS = [PLATFORMS.TVOS, PLATFORMS.WATCHOS];
