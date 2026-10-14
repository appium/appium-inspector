import {CAPABILITY_TYPES} from './session-builder.js';

const {TEXT, BOOL, NUM, OBJECT} = CAPABILITY_TYPES;

// Driver keys used to rank suggestions for the selected platform/automation
export const CAPABILITY_SUGGESTION_DRIVERS = {
  UIAUTOMATOR2: 'uiautomator2',
  ESPRESSO: 'espresso',
  XCUITEST: 'xcuitest',
};

const {UIAUTOMATOR2, ESPRESSO, XCUITEST} = CAPABILITY_SUGGESTION_DRIVERS;
const ANDROID = [UIAUTOMATOR2, ESPRESSO];

// Maps lowercase `platformName` values to the drivers that support them
export const PLATFORM_DRIVERS = {
  android: ANDROID,
  ios: [XCUITEST],
  tvos: [XCUITEST],
};

// Maps lowercase `automationName` values to driver keys
export const AUTOMATION_DRIVERS = {
  uiautomator2: [UIAUTOMATOR2],
  espresso: [ESPRESSO],
  xcuitest: [XCUITEST],
};

const cap = (name, type, drivers = []) => ({name, type, drivers});

// Commonly used capabilities. Every name and its driver support is taken from these references:
// - W3C WebDriver: https://w3c.github.io/webdriver/#capabilities
// - Appium base driver: https://appium.io/docs/en/latest/reference/session/caps/
// - UiAutomator2: https://github.com/appium/appium-uiautomator2-driver#capabilities
// - Espresso: https://github.com/appium/appium-espresso-driver#capabilities
// - XCUITest: https://appium.github.io/appium-xcuitest-driver/latest/reference/capabilities/
// An empty `drivers` list means the capability is standard or documented for all of these drivers.
export const CAPABILITY_SUGGESTIONS = [
  // W3C / Appium core
  cap('platformName', TEXT),
  cap('browserName', TEXT),
  cap('browserVersion', TEXT),
  cap('acceptInsecureCerts', BOOL),
  cap('pageLoadStrategy', TEXT),
  cap('proxy', OBJECT),
  cap('setWindowRect', BOOL),
  cap('timeouts', OBJECT),
  cap('unhandledPromptBehavior', TEXT),
  cap('appium:automationName', TEXT),
  cap('appium:platformVersion', TEXT),
  cap('appium:deviceName', TEXT),
  cap('appium:udid', TEXT),
  cap('appium:app', TEXT),
  cap('appium:noReset', BOOL),
  cap('appium:fullReset', BOOL),
  cap('appium:newCommandTimeout', NUM),
  cap('appium:eventTimings', BOOL),
  cap('appium:printPageSourceOnFindFailure', BOOL),
  cap('appium:language', TEXT),
  cap('appium:locale', TEXT),
  cap('appium:orientation', TEXT),
  cap('appium:autoWebview', BOOL),
  cap('appium:autoLaunch', BOOL),
  cap('appium:enablePerformanceLogging', BOOL, [XCUITEST]),

  // Android drivers (some also documented for XCUITest)
  cap('appium:appPackage', TEXT, ANDROID),
  cap('appium:appActivity', TEXT, ANDROID),
  cap('appium:appWaitActivity', TEXT, ANDROID),
  cap('appium:appWaitPackage', TEXT, ANDROID),
  cap('appium:appWaitDuration', NUM, ANDROID),
  cap('appium:appWaitForLaunch', BOOL, [UIAUTOMATOR2]),
  cap('appium:intentAction', TEXT, [UIAUTOMATOR2]),
  cap('appium:intentCategory', TEXT, [UIAUTOMATOR2]),
  cap('appium:intentFlags', TEXT, [UIAUTOMATOR2]),
  cap('appium:optionalIntentArguments', TEXT, [UIAUTOMATOR2]),
  cap('appium:autoGrantPermissions', BOOL, ANDROID),
  cap('appium:dontStopAppOnReset', BOOL, [UIAUTOMATOR2]),
  cap('appium:forceAppLaunch', BOOL, [UIAUTOMATOR2, XCUITEST]),
  cap('appium:shouldTerminateApp', BOOL, [UIAUTOMATOR2, XCUITEST]),
  cap('appium:uninstallOtherPackages', TEXT, ANDROID),
  cap('appium:allowTestPackages', BOOL, ANDROID),
  cap('appium:remoteAppsCacheLimit', NUM, ANDROID),
  cap('appium:enforceAppInstall', BOOL, [...ANDROID, XCUITEST]),
  cap('appium:systemPort', NUM, ANDROID),
  cap('appium:adbPort', NUM, ANDROID),
  cap('appium:remoteAdbHost', TEXT, ANDROID),
  cap('appium:adbExecTimeout', NUM, ANDROID),
  cap('appium:androidInstallTimeout', NUM, ANDROID),
  cap('appium:avd', TEXT, ANDROID),
  cap('appium:avdArgs', TEXT, ANDROID),
  cap('appium:avdEnv', OBJECT, ANDROID),
  cap('appium:avdLaunchTimeout', NUM, ANDROID),
  cap('appium:avdReadyTimeout', NUM, ANDROID),
  cap('appium:gpsEnabled', BOOL, ANDROID),
  cap('appium:isHeadless', BOOL, [...ANDROID, XCUITEST]),
  cap('appium:unlockType', TEXT, ANDROID),
  cap('appium:unlockKey', TEXT, ANDROID),
  cap('appium:skipUnlock', BOOL, ANDROID),
  cap('appium:ignoreHiddenApiPolicyError', BOOL, ANDROID),
  cap('appium:hideKeyboard', BOOL, ANDROID),
  cap('appium:skipLogcatCapture', BOOL, ANDROID),
  cap('appium:logcatFormat', TEXT, ANDROID),
  cap('appium:logcatFilterSpecs', TEXT, ANDROID),
  cap('appium:networkSpeed', TEXT, ANDROID),
  cap('appium:chromedriverPort', NUM, ANDROID),
  cap('appium:chromedriverPorts', OBJECT, ANDROID),
  cap('appium:chromedriverArgs', OBJECT, ANDROID),
  cap('appium:chromedriverExecutable', TEXT, ANDROID),
  cap('appium:chromedriverExecutableDir', TEXT, ANDROID),
  cap('appium:chromedriverChromeMappingFile', TEXT, ANDROID),
  cap('appium:chromedriverUseSystemExecutable', BOOL, ANDROID),
  cap('appium:chromedriverDisableBuildCheck', BOOL, ANDROID),
  cap('appium:recreateChromeDriverSessions', BOOL, ANDROID),
  cap('appium:extractChromeAndroidPackageFromContextName', BOOL, ANDROID),
  cap('appium:ensureWebviewsHavePages', BOOL, ANDROID),
  cap('appium:webviewDevtoolsPort', NUM, ANDROID),
  cap('appium:nativeWebScreenshot', BOOL, ANDROID),
  cap('appium:showChromedriverLog', BOOL, ANDROID),
  cap('appium:chromeOptions', OBJECT, ANDROID),
  cap('appium:chromeLoggingPrefs', OBJECT, [UIAUTOMATOR2]),

  // UiAutomator2
  cap('appium:uiautomator2ServerLaunchTimeout', NUM, [UIAUTOMATOR2]),
  cap('appium:uiautomator2ServerInstallTimeout', NUM, [UIAUTOMATOR2]),
  cap('appium:uiautomator2ServerReadTimeout', NUM, [UIAUTOMATOR2]),
  cap('appium:disableWindowAnimation', BOOL, ANDROID),
  cap('appium:skipServerInstallation', BOOL, ANDROID),
  cap('appium:disableSuppressAccessibilityService', BOOL, ANDROID),
  cap('appium:mjpegScreenshotUrl', TEXT, [UIAUTOMATOR2, XCUITEST]),
  cap('appium:userProfile', NUM, [UIAUTOMATOR2]),

  // Espresso
  cap('appium:espressoServerLaunchTimeout', NUM, [ESPRESSO]),
  cap('appium:espressoBuildConfig', TEXT, [ESPRESSO]),
  cap('appium:forceEspressoRebuild', BOOL, [ESPRESSO]),
  cap('appium:showGradleLog', BOOL, [ESPRESSO]),
  cap('appium:appLocale', OBJECT, [ESPRESSO]),

  // XCUITest
  cap('appium:bundleId', TEXT, [XCUITEST]),
  cap('appium:otherApps', TEXT, [...ANDROID, XCUITEST]),
  cap('appium:appPushTimeout', NUM, [XCUITEST]),
  cap('appium:autoAcceptAlerts', BOOL, [XCUITEST]),
  cap('appium:autoDismissAlerts', BOOL, [XCUITEST]),
  cap('appium:includeSafariInWebviews', BOOL, [XCUITEST]),
  cap('appium:safariInitialUrl', TEXT, [XCUITEST]),
  cap('appium:safariAllowPopups', BOOL, [XCUITEST]),
  cap('appium:safariIgnoreFraudWarning', BOOL, [XCUITEST]),
  cap('appium:webviewConnectTimeout', NUM, [XCUITEST]),
  cap('appium:showXcodeLog', BOOL, [XCUITEST]),
  cap('appium:xcodeOrgId', TEXT, [XCUITEST]),
  cap('appium:xcodeSigningId', TEXT, [XCUITEST]),
  cap('appium:updatedWDABundleId', TEXT, [XCUITEST]),
  cap('appium:useNewWDA', BOOL, [XCUITEST]),
  cap('appium:usePrebuiltWDA', BOOL, [XCUITEST]),
  cap('appium:useXctestrunFile', BOOL, [XCUITEST]),
  cap('appium:usePreinstalledWDA', BOOL, [XCUITEST]),
  cap('appium:prebuiltWDAPath', TEXT, [XCUITEST]),
  cap('appium:derivedDataPath', TEXT, [XCUITEST]),
  cap('appium:wdaLocalPort', NUM, [XCUITEST]),
  cap('appium:wdaBaseUrl', TEXT, [XCUITEST]),
  cap('appium:wdaLaunchTimeout', NUM, [XCUITEST]),
  cap('appium:wdaConnectionTimeout', NUM, [XCUITEST]),
  cap('appium:wdaStartupRetries', NUM, [XCUITEST]),
  cap('appium:wdaStartupRetryInterval', NUM, [XCUITEST]),
  cap('appium:webDriverAgentUrl', TEXT, [XCUITEST]),
  cap('appium:shouldUseSingletonTestManager', BOOL, [XCUITEST]),
  cap('appium:waitForIdleTimeout', NUM, [XCUITEST]),
  cap('appium:maxTypingFrequency', NUM, [XCUITEST]),
  cap('appium:connectHardwareKeyboard', BOOL, [XCUITEST]),
  cap('appium:forceSimulatorSoftwareKeyboardPresence', BOOL, [XCUITEST]),
  cap('appium:simulatorStartupTimeout', NUM, [XCUITEST]),
  cap('appium:simulatorTracePointer', BOOL, [XCUITEST]),
  cap('appium:simulatorPasteboardAutomaticSync', TEXT, [XCUITEST]),
  cap('appium:shutdownOtherSimulators', BOOL, [XCUITEST]),
  cap('appium:resetOnSessionStartOnly', BOOL, [XCUITEST]),
  cap('appium:enforceFreshSimulatorCreation', BOOL, [XCUITEST]),
  cap('appium:keepKeyChains', BOOL, [XCUITEST]),
  cap('appium:permissions', TEXT, [XCUITEST]),
  cap('appium:reduceMotion', BOOL, [XCUITEST]),
  cap('appium:processArguments', OBJECT, [XCUITEST]),
  cap('appium:showIOSLog', BOOL, [XCUITEST]),
  cap('appium:iosInstallPause', NUM, [XCUITEST]),
  cap('appium:commandTimeouts', TEXT, [XCUITEST]),
  cap('appium:mjpegServerPort', NUM, [UIAUTOMATOR2, XCUITEST]),
];
