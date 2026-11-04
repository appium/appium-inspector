const UIAUTOMATOR2_DOCS = 'https://appium.github.io/appium-uiautomator2-driver/latest/guides/capability-sets/';
const ESPRESSO_DOCS = 'https://appium.github.io/appium-espresso-driver/latest/getting-started/#creating-a-session';
const XCUITEST_DOCS = 'https://appium.github.io/appium-xcuitest-driver/latest/guides/capability-sets/';
const MAC2_DOCS = 'https://appium.github.io/appium-mac2-driver/latest/getting-started/#creating-a-session';
const WINCORE_DOCS = 'https://github.com/appium/appium-wincore-driver#examples';

export const CAPABILITY_TEMPLATES = [
  {
    id: 'android-uiautomator2-basic',
    name: 'Android (UiAutomator2 / Current App / Device Autoselected)',
    documentation: UIAUTOMATOR2_DOCS,
    caps: {platformName: 'Android', 'appium:automationName': 'UiAutomator2'},
  },
  {
    id: 'android-uiautomator2-appfile-real',
    name: 'Android (UiAutomator2 / App File / Real Device)',
    documentation: UIAUTOMATOR2_DOCS,
    caps: {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:udid': '<device-udid>',
      'appium:app': '/path/to/app/file',
    },
  },
  {
    id: 'android-uiautomator2-appfile-emulator',
    name: 'Android (UiAutomator2 / App File / Emulator)',
    documentation: UIAUTOMATOR2_DOCS,
    caps: {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:avd': '<emulator-name>',
      'appium:app': '/path/to/app/file',
    },
  },
  {
    id: 'android-uiautomator2-preinstalled-real',
    name: 'Android (UiAutomator2 / Pre-Installed App / Real Device)',
    documentation: UIAUTOMATOR2_DOCS,
    caps: {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:udid': '<device-udid>',
      'appium:appPackage': '<app-package-name>',
      'appium:appActivity': '<app-activity-name>',
      'appium:noReset': true,
    },
  },
  {
    id: 'android-uiautomator2-preinstalled-emulator',
    name: 'Android (UiAutomator2 / Pre-Installed App / Emulator)',
    documentation: UIAUTOMATOR2_DOCS,
    caps: {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:avd': '<emulator-name>',
      'appium:appPackage': '<app-package-name>',
      'appium:appActivity': '<app-activity-name>',
      'appium:noReset': true,
    },
  },
  {
    id: 'android-espresso-appfile-real',
    name: 'Android (Espresso / App File / Real Device)',
    documentation: ESPRESSO_DOCS,
    caps: {
      platformName: 'Android',
      'appium:automationName': 'Espresso',
      'appium:udid': '<device-udid>',
      'appium:app': '/path/to/app/file',
      'appium:espressoBuildConfig': '<espresso-server-config>',
    },
  },
  {
    id: 'android-espresso-appfile-emulator',
    name: 'Android (Espresso / App File / Emulator)',
    documentation: ESPRESSO_DOCS,
    caps: {
      platformName: 'Android',
      'appium:automationName': 'Espresso',
      'appium:avd': '<emulator-name>',
      'appium:app': '/path/to/app/file',
      'appium:espressoBuildConfig': '<espresso-server-config>',
    },
  },
  {
    id: 'ios-xcuitest-basic',
    name: 'iOS (XCUITest / Current App / Device Autoselected)',
    documentation: XCUITEST_DOCS,
    caps: {platformName: 'iOS', 'appium:automationName': 'XCUITest'},
  },
  {
    id: 'ios-xcuitest-appfile-real',
    name: 'iOS (XCUITest / App File / Real Device)',
    documentation: XCUITEST_DOCS,
    caps: {
      platformName: 'iOS',
      'appium:automationName': 'XCUITest',
      'appium:udid': '<device-udid>',
      'appium:app': '/path/to/app/file',
    },
  },
  {
    id: 'ios-xcuitest-appfile-simulator',
    name: 'iOS (XCUITest / App File / Simulator)',
    documentation: XCUITEST_DOCS,
    caps: {
      platformName: 'iOS',
      'appium:automationName': 'XCUITest',
      'appium:deviceName': '<simulator-name>',
      'appium:platformVersion': '<simulator-os-version>',
      'appium:app': '/path/to/app/file',
    },
  },
  {
    id: 'ios-xcuitest-preinstalled-real',
    name: 'iOS (XCUITest / Pre-Installed App / Real Device)',
    documentation: XCUITEST_DOCS,
    caps: {
      platformName: 'iOS',
      'appium:automationName': 'XCUITest',
      'appium:udid': '<device-udid>',
      'appium:bundleId': '<app-bundle-id>',
      'appium:noReset': true,
    },
  },
  {
    id: 'ios-xcuitest-preinstalled-simulator',
    name: 'iOS (XCUITest / Pre-Installed App / Simulator)',
    documentation: XCUITEST_DOCS,
    caps: {
      platformName: 'iOS',
      'appium:automationName': 'XCUITest',
      'appium:deviceName': '<simulator-name>',
      'appium:platformVersion': '<simulator-os-version>',
      'appium:bundleId': '<app-bundle-id>',
      'appium:noReset': true,
    },
  },
  {
    id: 'tvos-xcuitest-appfile-simulator',
    name: 'tvOS (XCUITest / App File / Simulator)',
    documentation: XCUITEST_DOCS,
    caps: {
      platformName: 'tvOS',
      'appium:automationName': 'XCUITest',
      'appium:deviceName': '<simulator-name>',
      'appium:platformVersion': '<simulator-os-version>',
      'appium:app': '/path/to/app/file',
    },
  },
  {
    id: 'watchos-xcuitest-appfile-simulator',
    name: 'watchOS (XCUITest / App File / Simulator)',
    documentation: XCUITEST_DOCS,
    caps: {
      platformName: 'watchOS',
      'appium:automationName': 'XCUITest',
      'appium:deviceName': '<simulator-name>',
      'appium:platformVersion': '<simulator-os-version>',
      'appium:app': '/path/to/app/file',
    },
  },
  {
    id: 'macos-mac2-basic',
    name: 'macOS (Mac2 / Finder)',
    documentation: MAC2_DOCS,
    caps: {platformName: 'mac', 'appium:automationName': 'Mac2'},
  },
  {
    id: 'windows-wincore-basic',
    name: 'Windows (WinCore / Desktop)',
    documentation: WINCORE_DOCS,
    caps: {platformName: 'Windows', 'appium:automationName': 'Wincore', 'appium:app': 'Root'},
  },
];
