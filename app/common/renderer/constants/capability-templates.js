const UIAUTOMATOR2_DOCS = 'https://appium.github.io/appium-uiautomator2-driver/latest/';
const XCUITEST_DOCS = 'https://appium.github.io/appium-xcuitest-driver/latest/reference/capabilities/';

export const CAPABILITY_TEMPLATES = [
  {
    id: 'android-native',
    name: 'Android (UiAutomator2)',
    description: 'androidNativeTemplateDescription',
    documentation: UIAUTOMATOR2_DOCS,
    caps: {platformName: 'Android', 'appium:automationName': 'UiAutomator2'},
  },
  {
    id: 'android-chrome',
    name: 'Android Chrome (UiAutomator2)',
    description: 'androidChromeTemplateDescription',
    documentation: UIAUTOMATOR2_DOCS,
    caps: {platformName: 'Android', 'appium:automationName': 'UiAutomator2', browserName: 'Chrome'},
  },
  {
    id: 'ios-native',
    name: 'iOS (XCUITest)',
    description: 'iosNativeTemplateDescription',
    documentation: XCUITEST_DOCS,
    caps: {platformName: 'iOS', 'appium:automationName': 'XCUITest'},
  },
  {
    id: 'ios-safari',
    name: 'iOS Safari (XCUITest)',
    description: 'iosSafariTemplateDescription',
    documentation: XCUITEST_DOCS,
    caps: {platformName: 'iOS', 'appium:automationName': 'XCUITest', browserName: 'Safari'},
  },
];
