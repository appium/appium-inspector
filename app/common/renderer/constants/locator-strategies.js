import {DRIVERS} from './common.js';

export const W3C_STRATEGIES = {
  // Drivers may not support all of these in native context
  CSS: 'css selector',
  LINK_TEXT: 'link text',
  PARTIAL_LINK_TEXT: 'partial link text',
  TAG_NAME: 'tag name',
  XPATH: 'xpath',
};

export const CUSTOM_STRATEGIES = {
  // JSONWP/MJSONWP
  ID: 'id',
  NAME: 'name',
  CLASS_NAME: 'class name',
  ACCESSIBILITY_ID: 'accessibility id',
  // XCUITest & Mac2
  IOS_PREDICATE: '-ios predicate string',
  IOS_CLASS_CHAIN: '-ios class chain',
  // UiAutomator2
  ANDROID_UIAUTOMATOR: '-android uiautomator',
  ANDROID_PREDICATE: '-android predicate string',
  ANDROID_CLASS_CHAIN: '-android class chain',
  // Espresso
  TEXT: 'text',
  ANDROID_VIEWTAG: '-android viewtag',
  ANDROID_DATAMATCHER: '-android datamatcher',
  ANDROID_VIEWMATCHER: '-android viewmatcher',
  // WinCore
  WIN_UIAUTOMATION: '-windows uiautomation',
};

export const ALL_STRATEGIES = {...W3C_STRATEGIES, ...CUSTOM_STRATEGIES};

// Render names of raw locator strategies ('-ios class chain' -> 'Class Chain')
export const RENDERED_STRATEGIES = Object.fromEntries(
  Object.values(ALL_STRATEGIES).map((v) => {
    const nameSplit = v.split(' ');
    // Remove any custom prefix that begins with a dash
    if (nameSplit[0].startsWith('-')) {
      nameSplit.splice(0, 1);
    }
    const capitalizedName = nameSplit.map((w) => w[0].toUpperCase() + w.substring(1)).join(' ');
    return [v, capitalizedName];
  }),
);

export const STRATEGY_DOCS = {
  [CUSTOM_STRATEGIES.ANDROID_UIAUTOMATOR]:
    'https://appium.github.io/appium-uiautomator2-driver/latest/guides/uiautomator-locator-strategy/',
  [CUSTOM_STRATEGIES.ANDROID_CLASS_CHAIN]:
    'https://appium.github.io/appium-uiautomator2-driver/latest/guides/android-class-chain/',
  [CUSTOM_STRATEGIES.ANDROID_PREDICATE]:
    'https://appium.github.io/appium-uiautomator2-driver/latest/guides/android-class-chain/#predicate-string-strategy',
  [CUSTOM_STRATEGIES.ANDROID_DATAMATCHER]:
    'https://appium.github.io/appium-espresso-driver/latest/guides/datamatcher-selector/',
  [CUSTOM_STRATEGIES.IOS_CLASS_CHAIN]:
    'https://appium.github.io/appium-xcuitest-driver/latest/reference/ios-class-chain/',
  [CUSTOM_STRATEGIES.IOS_PREDICATE]: 'https://appium.github.io/appium-xcuitest-driver/latest/reference/ios-predicate/',
  [CUSTOM_STRATEGIES.WIN_UIAUTOMATION]:
    'https://appium.github.io/appium-wincore-driver/latest/reference/windows-uiautomation/',
};

// Driver-specific mapping

// Strategies shown for drivers not specified below
export const DEFAULT_STRATEGIES = [
  CUSTOM_STRATEGIES.ID,
  CUSTOM_STRATEGIES.ACCESSIBILITY_ID,
  CUSTOM_STRATEGIES.NAME,
  CUSTOM_STRATEGIES.CLASS_NAME,
  W3C_STRATEGIES.XPATH,
];

// https://appium.github.io/appium-uiautomator2-driver/latest/reference/locator-strategies/
const UIAUTOMATOR2_STRATEGIES = [
  CUSTOM_STRATEGIES.ID,
  CUSTOM_STRATEGIES.ACCESSIBILITY_ID,
  CUSTOM_STRATEGIES.CLASS_NAME,
  CUSTOM_STRATEGIES.ANDROID_UIAUTOMATOR,
  CUSTOM_STRATEGIES.ANDROID_PREDICATE,
  CUSTOM_STRATEGIES.ANDROID_CLASS_CHAIN,
  W3C_STRATEGIES.XPATH,
];

// https://appium.github.io/appium-espresso-driver/latest/reference/locator-strategies/
const ESPRESSO_STRATEGIES = [
  CUSTOM_STRATEGIES.ID,
  CUSTOM_STRATEGIES.ACCESSIBILITY_ID,
  CUSTOM_STRATEGIES.CLASS_NAME,
  CUSTOM_STRATEGIES.TEXT,
  CUSTOM_STRATEGIES.ANDROID_VIEWTAG,
  W3C_STRATEGIES.TAG_NAME,
  CUSTOM_STRATEGIES.ANDROID_DATAMATCHER,
  CUSTOM_STRATEGIES.ANDROID_VIEWMATCHER,
  W3C_STRATEGIES.XPATH,
];

// https://appium.github.io/appium-xcuitest-driver/latest/reference/locator-strategies/
const XCUITEST_STRATEGIES = [
  CUSTOM_STRATEGIES.ID,
  CUSTOM_STRATEGIES.ACCESSIBILITY_ID,
  CUSTOM_STRATEGIES.NAME,
  CUSTOM_STRATEGIES.CLASS_NAME,
  CUSTOM_STRATEGIES.IOS_PREDICATE,
  CUSTOM_STRATEGIES.IOS_CLASS_CHAIN,
  W3C_STRATEGIES.XPATH,
];

// https://appium.github.io/appium-mac2-driver/latest/reference/locator-strategies/
const MAC2_STRATEGIES = XCUITEST_STRATEGIES;

// https://appium.github.io/appium-wincore-driver/latest/reference/locator-strategies/
const WINCORE_STRATEGIES = [
  CUSTOM_STRATEGIES.ID,
  CUSTOM_STRATEGIES.ACCESSIBILITY_ID,
  CUSTOM_STRATEGIES.NAME,
  CUSTOM_STRATEGIES.CLASS_NAME,
  W3C_STRATEGIES.TAG_NAME,
  W3C_STRATEGIES.CSS,
  CUSTOM_STRATEGIES.WIN_UIAUTOMATION,
  W3C_STRATEGIES.XPATH,
];

// https://github.com/appium/appium-windows-driver/#element-location
const WINDOWS_STRATEGIES = [
  CUSTOM_STRATEGIES.ID,
  CUSTOM_STRATEGIES.ACCESSIBILITY_ID,
  CUSTOM_STRATEGIES.NAME,
  CUSTOM_STRATEGIES.CLASS_NAME,
  W3C_STRATEGIES.TAG_NAME,
  W3C_STRATEGIES.XPATH,
];

// This excludes drivers that only support web contexts
export const DRIVER_STRATEGIES = {
  [DRIVERS.ESPRESSO]: ESPRESSO_STRATEGIES,
  [DRIVERS.MAC2]: MAC2_STRATEGIES,
  [DRIVERS.UIAUTOMATOR2]: UIAUTOMATOR2_STRATEGIES,
  [DRIVERS.WINCORE]: WINCORE_STRATEGIES,
  [DRIVERS.WINDOWS]: WINDOWS_STRATEGIES,
  [DRIVERS.XCUITEST]: XCUITEST_STRATEGIES,
};
