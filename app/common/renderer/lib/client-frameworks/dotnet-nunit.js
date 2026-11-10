import refractorCsharp from 'refractor/csharp';

import {DRIVERS, PLATFORMS} from '../../constants/common.js';
import {LOCATOR_STRATEGIES} from '../../constants/session-inspector.js';
import CommonClientFramework from './common.js';

const PKG_AND_CLASS_MAP = {
  ANDROID: ['Appium.Android', 'AndroidDriver'],
  IOS: ['Appium.iOS', 'IOSDriver'],
  MACOS: ['Appium.Mac', 'MacDriver'],
  WINDOWS: ['Appium.Windows', 'WindowsDriver'],
  CHROMIUM: ['Chromium', 'ChromiumDriver'],
  SAFARI: ['Safari', 'SafariDriver'],
  GECKO: ['Firefox', 'FirefoxDriver'],
  UNKNOWN: ['unknownPlatform', 'UnknownDriver'],
};

const AUTOMATION_NAME_MAP = new Map([
  [DRIVERS.UIAUTOMATOR2, PKG_AND_CLASS_MAP.ANDROID],
  [DRIVERS.ESPRESSO, PKG_AND_CLASS_MAP.ANDROID],
  [DRIVERS.XCUITEST, PKG_AND_CLASS_MAP.IOS],
  [DRIVERS.MAC2, PKG_AND_CLASS_MAP.MACOS],
  [DRIVERS.WINDOWS, PKG_AND_CLASS_MAP.WINDOWS],
  [DRIVERS.WINCORE, PKG_AND_CLASS_MAP.WINDOWS],
  [DRIVERS.CHROMIUM, PKG_AND_CLASS_MAP.CHROMIUM],
  [DRIVERS.SAFARI, PKG_AND_CLASS_MAP.SAFARI],
  [DRIVERS.GECKO, PKG_AND_CLASS_MAP.GECKO],
]);

const PLATFORM_NAME_MAP = new Map([
  [PLATFORMS.ANDROID, PKG_AND_CLASS_MAP.ANDROID],
  [PLATFORMS.IOS, PKG_AND_CLASS_MAP.IOS],
  [PLATFORMS.MACOS, PKG_AND_CLASS_MAP.MACOS],
  [PLATFORMS.WINDOWS, PKG_AND_CLASS_MAP.WINDOWS],
]);

export default class DotNetNUnitFramework extends CommonClientFramework {
  static readableName = '.NET - NUnit';
  static refractorLang = 'csharp';
  static refractorLib = refractorCsharp;

  getCSharpVal(jsonVal) {
    if (Array.isArray(jsonVal)) {
      const convertedItems = jsonVal.map((item) => this.getCSharpVal(item));
      return `new object[] {${convertedItems.join(', ')}}`;
    } else if (jsonVal !== null && typeof jsonVal === 'object') {
      const convertedItems = Object.entries(jsonVal).map(([k, v]) => `{${JSON.stringify(k)}, ${this.getCSharpVal(v)}}`);
      return `new Dictionary<string, dynamic> {${convertedItems.join(', ')}}`;
    }
    return JSON.stringify(jsonVal);
  }

  wrapWithBoilerplate(code) {
    const [pkg, cls] = this.getPackageAndClass(AUTOMATION_NAME_MAP, PLATFORM_NAME_MAP, PKG_AND_CLASS_MAP.UNKNOWN);
    let capStr = this.indent(
      Object.entries(this.caps)
        .map(([k, v]) => `options.AddAdditionalAppiumOption(${JSON.stringify(k)}, ${this.getCSharpVal(v)});`)
        .join('\n'),
      8,
    );

    return `// This sample code supports Appium .NET client >=5
// https://github.com/appium/dotnet-client
using System;
using System.Collections.Generic;
using System.Drawing;
using NUnit.Framework;
using OpenQA.Selenium;
using OpenQA.Selenium.Interactions;
using OpenQA.Selenium.Appium;
using OpenQA.Selenium.${pkg};
using OpenQA.Selenium.Appium.Enums;

namespace AppiumTests;

public class Tests
{
    private ${cls} _driver;

    [OneTimeSetUp]
    public void SetUp()
    {
        var serverUri = new Uri(${this.quote(this.serverUrl)});
        var options = new AppiumOptions();
${capStr}

        _driver = new ${cls}(serverUri, options);
    }

    [OneTimeTearDown]
    public void TearDown()
    {
        _driver.Dispose();
    }

    [Test]
    public void SampleTest()
    {
${this.indent(code, 8)}
    }
}
`;
  }

  addComment(comment) {
    return `// ${comment}`;
  }

  codeFor_findAndAssign(strategy, locator, localVar, isArray) {
    const byMap = {
      [LOCATOR_STRATEGIES.ID]: 'Id',
      [LOCATOR_STRATEGIES.XPATH]: 'XPath',
      [LOCATOR_STRATEGIES.NAME]: 'Name',
      [LOCATOR_STRATEGIES.CLASS_NAME]: 'ClassName',
      [LOCATOR_STRATEGIES.ACCESSIBILITY_ID]: 'AccessibilityId',
      [LOCATOR_STRATEGIES.PREDICATE]: 'IosNsPredicate',
      [LOCATOR_STRATEGIES.CLASS_CHAIN]: 'IosClassChain',
      [LOCATOR_STRATEGIES.UIAUTOMATOR]: 'AndroidUIAutomator',
      // [LOCATOR_STRATEGIES.TEXT]: 'not supported',
      // [LOCATOR_STRATEGIES.VIEWTAG]: 'not supported',
      [LOCATOR_STRATEGIES.DATAMATCHER]: 'AndroidDataMatcher',
      [LOCATOR_STRATEGIES.VIEWMATCHER]: 'AndroidViewMatcher',
      [LOCATOR_STRATEGIES.WIN_UIAUTOMATION]: 'WindowsAutomation',
    };
    if (!byMap[strategy]) {
      return this.handleUnsupportedLocatorStrategy(strategy, locator);
    }
    if (isArray) {
      return `var ${localVar} = _driver.FindElements(MobileBy.${byMap[strategy]}(${JSON.stringify(locator)}));`;
    } else {
      return `var ${localVar} = _driver.FindElement(MobileBy.${byMap[strategy]}(${JSON.stringify(locator)}));`;
    }
  }

  codeFor_elementClick(varName, varIndex) {
    return `${this.getVarName(varName, varIndex)}.Click();`;
  }

  codeFor_elementClear(varName, varIndex) {
    return `${this.getVarName(varName, varIndex)}.Clear();`;
  }

  codeFor_elementSendKeys(varName, varIndex, text) {
    return `${this.getVarName(varName, varIndex)}.SendKeys(${JSON.stringify(text)});`;
  }

  codeFor_tap(varNameIgnore, varIndexIgnore, pointerActions) {
    const {x, y} = this.getTapCoordinatesFromPointerActions(pointerActions);
    return `
var finger = new PointerInputDevice(PointerKind.Touch);
var tapPoint = new Point(${x}, ${y});
var tap = new ActionSequence(finger);
tap.AddAction(finger.CreatePointerMove(CoordinateOrigin.Viewport, tapPoint.X, tapPoint.Y, TimeSpan.Zero));
tap.AddAction(finger.CreatePointerDown(MouseButton.Left));
tap.AddAction(new PauseInteraction(finger, TimeSpan.FromMilliseconds(50)));
tap.AddAction(finger.CreatePointerUp(MouseButton.Left));
_driver.PerformActions(new List<ActionSequence> { tap });
`;
  }

  codeFor_swipe(varNameIgnore, varIndexIgnore, pointerActions) {
    const {x1, y1, x2, y2} = this.getSwipeCoordinatesFromPointerActions(pointerActions);
    return `
var finger = new PointerInputDevice(PointerKind.Touch);
var start = new Point(${x1}, ${y1});
var end = new Point(${x2}, ${y2});
var swipe = new ActionSequence(finger);
swipe.AddAction(finger.CreatePointerMove(CoordinateOrigin.Viewport, start.X, start.Y, TimeSpan.Zero));
swipe.AddAction(finger.CreatePointerDown(MouseButton.Left));
swipe.AddAction(finger.CreatePointerMove(CoordinateOrigin.Viewport, end.X, end.Y, TimeSpan.FromMilliseconds(1000)));
swipe.AddAction(finger.CreatePointerUp(MouseButton.Left));
_driver.PerformActions(new List<ActionSequence> { swipe });
`;
  }

  // Top-Level Commands

  codeFor_executeScriptNoArgs(scriptCmd) {
    return `_driver.ExecuteScript(${JSON.stringify(scriptCmd)});`;
  }

  codeFor_executeScriptWithArgs(scriptCmd, jsonArg) {
    // C# Dictionary accepts a sequence of tuples
    const scriptArg = jsonArg[0];
    const scriptArgVal = this.getCSharpVal(scriptArg);
    const wrappedScriptArgVal =
      scriptArg === null || Array.isArray(scriptArg) ? `(object) ${scriptArgVal}` : scriptArgVal;
    return `_driver.ExecuteScript(${JSON.stringify(scriptCmd)}, ${wrappedScriptArgVal});`;
  }

  codeFor_updateSettings(varNameIgnore, varIndexIgnore, settingsJson) {
    try {
      const settings = Object.entries(settingsJson).map(
        ([settingName, settingValue]) =>
          `_driver.SetSetting(${this.quote(settingName)}, ${this.getCSharpVal(settingValue)});`,
      );
      return settings.join('\n');
    } catch {
      return `// Could not parse: ${JSON.stringify(settingsJson)}`;
    }
  }

  codeFor_getSettings() {
    return `let settings = _driver.Settings();`;
  }

  // Session

  codeFor_status() {
    return `let status = _driver.Status;`;
  }

  codeFor_getSession() {
    return `let sessionDetails = _driver.SessionDetails;`;
  }

  codeFor_getAppiumCommands() {
    return `// Not supported: getAppiumCommands`;
  }

  codeFor_getAppiumExtensions() {
    return `// Not supported: getAppiumExtensions`;
  }

  codeFor_getAppiumSessionCapabilities() {
    return `// Not supported: getAppiumSessionCapabilities`;
  }

  codeFor_getTimeouts() {
    return `
let timeouts = new Dictionary<string, TimeSpan>()
{
    { "script", _driver.Manage().Timeouts().AsynchronousJavaScript },
    { "pageLoad", _driver.Manage().Timeouts().PageLoad },
    { "implicit", _driver.Manage().Timeouts().ImplicitWait }
};
`;
  }

  codeFor_setTimeouts(/*varNameIgnore, varIndexIgnore, timeoutsJson*/) {
    return '/* TODO implement setTimeouts */';
  }

  codeFor_getLogTypes() {
    return `let logTypes = _driver.Manage().Logs.AvailableLogTypes;`;
  }

  codeFor_getLogs(varNameIgnore, varIndexIgnore, logType) {
    return `let logs = _driver.Manage().Logs.GetLog(${this.quote(logType)});`;
  }

  // Context

  codeFor_getAppiumContext() {
    return `var context = _driver.Context;`;
  }

  codeFor_getAppiumContexts() {
    return `var contexts = _driver.Contexts;`;
  }

  codeFor_switchAppiumContext(varNameIgnore, varIndexIgnore, name) {
    return `_driver.Context = ${this.quote(name)};`;
  }

  // Device Interaction

  codeFor_getWindowRect() {
    return `let windowRect = _driver.GetWindowRect;`;
  }

  codeFor_takeScreenshot() {
    return `let screenshotBase64 = _driver.GetScreenshot().AsBase64EncodedString;`;
  }

  codeFor_isKeyboardShown() {
    return `let isKeyboardShown = _driver.IsKeyboardShown();`;
  }

  codeFor_getOrientation() {
    return `let orientation = _driver.Orientation;`;
  }

  codeFor_setOrientation(varNameIgnore, varIndexIgnore, orientation) {
    return `_driver.Orientation = ${this.quote(orientation)};`;
  }

  codeFor_getGeoLocation() {
    return `let location = _driver.Location;`;
  }

  codeFor_setGeoLocation(varNameIgnore, varIndexIgnore, latitude, longitude, altitude) {
    return `_driver.Location = new Location { Latitude = ${latitude}, Longitude = ${longitude}, Altitude = ${altitude} };`;
  }

  codeFor_rotateDevice() {
    return `// Not supported: rotateDevice`;
  }

  // App Management

  codeFor_installApp(varNameIgnore, varIndexIgnore, app) {
    return `_driver.InstallApp(${this.quote(app)});`;
  }

  codeFor_isAppInstalled(varNameIgnore, varIndexIgnore, app) {
    return `var isAppInstalled = _driver.IsAppInstalled(${this.quote(app)});`;
  }

  codeFor_activateApp(varNameIgnore, varIndexIgnore, app) {
    return `_driver.ActivateApp(${this.quote(app)});`;
  }

  codeFor_terminateApp(varNameIgnore, varIndexIgnore, app) {
    return `_driver.TerminateApp(${this.quote(app)});`;
  }

  codeFor_removeApp(varNameIgnore, varIndexIgnore, app) {
    return `_driver.RemoveApp(${this.quote(app)})`;
  }

  codeFor_queryAppState(varNameIgnore, varIndexIgnore, app) {
    return `var appState = _driver.GetAppState(${this.quote(app)});`;
  }

  // File Transfer

  codeFor_pushFile(varNameIgnore, varIndexIgnore, pathToInstallTo, fileContentString) {
    return `_driver.PushFile(${this.quote(pathToInstallTo)}, ${this.quote(fileContentString)});`;
  }

  codeFor_pullFile(varNameIgnore, varIndexIgnore, pathToPullFrom) {
    return `var fileBase64 = _driver.PullFile(${this.quote(pathToPullFrom)});`;
  }

  codeFor_pullFolder(varNameIgnore, varIndexIgnore, folderToPullFrom) {
    return `var folderBase64 = _driver.PullFolder(${this.quote(folderToPullFrom)});`;
  }

  // Web

  codeFor_navigateTo(varNameIgnore, varIndexIgnore, url) {
    return `_driver.Url = ${this.quote(url)};`;
  }

  codeFor_getUrl() {
    return `var currentUrl = _driver.Url;`;
  }

  codeFor_back() {
    return `_driver.Navigate().Back();`;
  }

  codeFor_forward() {
    return `_driver.Navigate().Forward();`;
  }

  codeFor_refresh() {
    return `_driver.Navigate().Refresh();`;
  }

  codeFor_getTitle() {
    return `var title = _driver.Title;`;
  }

  codeFor_getWindowHandle() {
    return `var windowHandle = _driver.CurrentWindowHandle;`;
  }

  codeFor_closeWindow() {
    return `_driver.Close();`;
  }

  codeFor_switchToWindow(varNameIgnore, varIndexIgnore, handle) {
    return `_driver.SwitchTo().Window(${this.quote(handle)});`;
  }

  codeFor_getWindowHandles() {
    return `var windowHandles = _driver.WindowHandles;`;
  }

  codeFor_createWindow() {
    return `// Not supported: createWindow`;
  }
}
