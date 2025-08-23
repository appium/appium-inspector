import _ from 'lodash';

import CommonClientFramework from './common.js';

export default class DotNetNUnitFramework extends CommonClientFramework {
  static readableName = '.NET - NUnit';
  static highlightLang = 'csharp';

  getCSharpVal(jsonVal) {
    if (Array.isArray(jsonVal)) {
      const convertedItems = jsonVal.map((item) => this.getCSharpVal(item));
      return `{${convertedItems.join(', ')}}`;
    } else if (typeof jsonVal === 'object') {
      const convertedItems = _.map(
        jsonVal,
        (v, k) => `{${JSON.stringify(k)}, ${this.getCSharpVal(v)}}`,
      );
      return `new Dictionary<string, dynamic> {${convertedItems.join(', ')}}`;
    }
    return JSON.stringify(jsonVal);
  }

  wrapWithBoilerplate(code) {
    let [pkg, cls] = (() => {
      if (this.caps.platformName) {
        switch (this.caps.platformName.toLowerCase()) {
          case 'ios':
            return ['iOS', 'IOSDriver'];
          case 'android':
            return ['Android', 'AndroidDriver'];
          case 'windows':
            return ['Windows', 'WindowsDriver'];
          case 'mac2':
            return ['Mac', 'MacDriver'];
          default:
            return ['unknownPlatform', 'UnknownDriver'];
        }
      } else {
        return ['unknownPlatform', 'UnknownDriver'];
      }
    })();
    let capStr = this.indent(
      _.map(
        this.caps,
        (v, k) =>
          `options.AddAdditionalAppiumOption(${JSON.stringify(k)}, ${this.getCSharpVal(v)});`,
      ).join('\n'),
      8,
    );

    return `// This sample code supports Appium .NET client >=5
// https://github.com/appium/dotnet-client
using System;
using System.Drawing;
using NUnit.Framework;
using OpenQA.Selenium;
using OpenQA.Selenium.Interactions;
using OpenQA.Selenium.Appium;
using OpenQA.Selenium.Appium.${pkg};
using OpenQA.Selenium.Appium.Enums;

namespace AppiumTests;

public class Tests
{
    private ${cls} _driver;

    [OneTimeSetUp]
    public void SetUp()
    {
        var serverUri = new Uri("${this.serverUrl}");
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
    let suffixMap = {
      xpath: 'XPath',
      'accessibility id': 'AccessibilityId',
      id: 'Id',
      'class name': 'ClassName',
      name: 'Name',
      '-android uiautomator': 'AndroidUIAutomator',
      '-android datamatcher': 'AndroidDataMatcher',
      // '-android viewtag': 'not supported',
      '-ios predicate string': 'IosNsPredicate',
      '-ios class chain': 'IosClassChain',
    };
    if (!suffixMap[strategy]) {
      return this.handleUnsupportedLocatorStrategy(strategy, locator);
    }
    if (isArray) {
      return `var ${localVar} = _driver.FindElements(MobileBy.${
        suffixMap[strategy]
      }(${JSON.stringify(locator)}));`;
    } else {
      return `var ${localVar} = _driver.FindElement(MobileBy.${
        suffixMap[strategy]
      }(${JSON.stringify(locator)}));`;
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
    return `_driver.ExecuteScript(${JSON.stringify(scriptCmd)}, ${this.getCSharpVal(jsonArg[0])});`;
  }

  codeFor_updateSettings(varNameIgnore, varIndexIgnore, settingsJson) {
    try {
      const settings = _.toPairs(settingsJson).map(
        ([settingName, settingValue]) =>
          `_driver.SetSetting("${settingName}", ${this.getCSharpVal(settingValue)});`,
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
    return `let logs = _driver.Manage().Logs.GetLog("${logType}");`;
  }

  // Context

  codeFor_getAppiumContext() {
    return `var context = _driver.Context;`;
  }

  codeFor_getAppiumContexts() {
    return `var contexts = _driver.Contexts;`;
  }

  codeFor_switchAppiumContext(varNameIgnore, varIndexIgnore, name) {
    return `_driver.Context = "${name}";`;
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
    return `_driver.Orientation = "${orientation}";`;
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
    return `_driver.InstallApp("${app}");`;
  }

  codeFor_isAppInstalled(varNameIgnore, varIndexIgnore, app) {
    return `var isAppInstalled = _driver.IsAppInstalled("${app}");`;
  }

  codeFor_activateApp(varNameIgnore, varIndexIgnore, app) {
    return `_driver.ActivateApp("${app}");`;
  }

  codeFor_terminateApp(varNameIgnore, varIndexIgnore, app) {
    return `_driver.TerminateApp("${app}");`;
  }

  codeFor_removeApp(varNameIgnore, varIndexIgnore, app) {
    return `_driver.RemoveApp("${app}")`;
  }

  codeFor_queryAppState(varNameIgnore, varIndexIgnore, app) {
    return `var appState = _driver.GetAppState("${app}");`;
  }

  // File Transfer

  codeFor_pushFile(varNameIgnore, varIndexIgnore, pathToInstallTo, fileContentString) {
    return `_driver.PushFile("${pathToInstallTo}", "${fileContentString}");`;
  }

  codeFor_pullFile(varNameIgnore, varIndexIgnore, pathToPullFrom) {
    return `var fileBase64 = _driver.PullFile("${pathToPullFrom}");`;
  }

  codeFor_pullFolder(varNameIgnore, varIndexIgnore, folderToPullFrom) {
    return `var folderBase64 = _driver.PullFolder("${folderToPullFrom}");`;
  }

  // Web

  codeFor_navigateTo(varNameIgnore, varIndexIgnore, url) {
    return `_driver.Url = "${url}";`;
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
    return `_driver.SwitchTo().Window("${handle}");`;
  }

  codeFor_getWindowHandles() {
    return `var windowHandles = _driver.WindowHandles;`;
  }

  codeFor_createWindow() {
    return `// Not supported: createWindow`;
  }
}
