const UIAUTOMATOR2_DOCS = 'https://appium.github.io/appium-uiautomator2-driver/latest/guides/capability-sets/';
const XCUITEST_DOCS = 'https://appium.github.io/appium-xcuitest-driver/latest/guides/capability-sets/';

export const CAPABILITY_TEMPLATES = [
  {
    id: 'android-native',
    name: 'Android (UiAutomator2)',
    documentation: UIAUTOMATOR2_DOCS,
    caps: {platformName: 'Android', 'appium:automationName': 'UiAutomator2'},
  },
  {
    id: 'ios-native',
    name: 'iOS (XCUITest)',
    documentation: XCUITEST_DOCS,
    caps: {platformName: 'iOS', 'appium:automationName': 'XCUITest'},
  },
];
