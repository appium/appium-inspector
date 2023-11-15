import _ from 'lodash';

import Framework from './framework';

class DotNetNUnitFramework extends Framework {
  get language() {
    return 'csharp';
  }

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
          `options.AddAdditionalAppiumOption(${JSON.stringify(k)}, ${this.getCSharpVal(v)})`,
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

  codeFor_click(varName, varIndex) {
    return `${this.getVarName(varName, varIndex)}.Click();`;
  }

  codeFor_clear(varName, varIndex) {
    return `${this.getVarName(varName, varIndex)}.Clear();`;
  }

  codeFor_sendKeys(varName, varIndex, text) {
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
driver.PerformActions(new List<ActionSequence> { tap });
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
driver.PerformActions(new List<ActionSequence> { swipe });
`;
  }

  // Execute Script

  codeFor_executeScriptNoArgs(scriptCmd) {
    return `_driver.ExecuteScript(${JSON.stringify(scriptCmd)});`;
  }

  codeFor_executeScriptWithArgs(scriptCmd, jsonArg) {
    // C# Dictionary accepts a sequence of tuples
    return `_driver.ExecuteScript(${JSON.stringify(scriptCmd)}, ${this.getCSharpVal(jsonArg[0])});`;
  }

  // App Management

  codeFor_getCurrentActivity() {
    return `var activityName = ${this.codeFor_executeScriptNoArgs('mobile: getCurrentActivity')}`;
  }

  codeFor_getCurrentPackage() {
    return `var packageName = ${this.codeFor_executeScriptNoArgs('mobile: getCurrentPackage')}`;
  }

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

  codeFor_getStrings(varNameIgnore, varIndexIgnore, language, stringFile) {
    return `var appStrings = _driver.GetAppStringDictionary(${language ? `"${language}", ` : ''}${
      stringFile ? `"${stringFile}"` : ''
    });`;
  }

  // Clipboard

  codeFor_getClipboard() {
    return `var clipboardText = _driver.GetClipboardText();`;
  }

  codeFor_setClipboard(varNameIgnore, varIndexIgnore, clipboardText) {
    return `_driver.SetClipboardText("${clipboardText}");`;
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

  // Device Interaction

  codeFor_isLocked() {
    return `let isLocked = ${this.codeFor_executeScriptNoArgs('mobile: isLocked')}`;
  }

  codeFor_rotateDevice() {
    return `// Not supported: rotateDevice`;
  }

  codeFor_touchId(varNameIgnore, varIndexIgnore, match) {
    return `_driver.PerformTouchID(${match});`;
  }

  codeFor_toggleEnrollTouchId() {
    return `// Not supported: toggleEnrollTouchId`;
  }

  // Keyboard

  codeFor_isKeyboardShown() {
    return `let isKeyboardShown = _driver.IsKeyboardShown();`;
  }

  // Connectivity

  codeFor_toggleAirplaneMode() {
    return `_driver.ToggleAirplaneMode();`;
  }

  codeFor_toggleData() {
    return `_driver.ToggleData();`;
  }

  codeFor_toggleWiFi() {
    return `_driver.ToggleWiFi();`;
  }

  codeFor_sendSMS(varNameIgnore, varIndexIgnore, phoneNumber, text) {
    return `_driver.SendSms("${phoneNumber}", "${text}");`;
  }

  codeFor_gsmCall(varNameIgnore, varIndexIgnore, phoneNumber, action) {
    return `_driver.MakeGsmCall("${phoneNumber}", "${action}");`;
  }

  codeFor_gsmSignal(varNameIgnore, varIndexIgnore, signalStrength) {
    return `_driver.SetGsmSignalStrength("${signalStrength}");`;
  }

  codeFor_gsmVoice(varNameIgnore, varIndexIgnore, state) {
    return `_driver.SetGsmVoice("${state}");`;
  }

  // Session

  codeFor_getSession() {
    return `let sessionDetails = _driver.SessionDetails;`;
  }

  codeFor_setTimeouts(/*varNameIgnore, varIndexIgnore, timeoutsJson*/) {
    return '/* TODO implement setTimeouts */';
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

  codeFor_getLogTypes() {
    return `let logTypes = _driver.Manage().Logs.AvailableLogTypes;`;
  }

  codeFor_getLogs(varNameIgnore, varIndexIgnore, logType) {
    return `let logs = _driver.Manage().Logs.GetLog("${logType}");`;
  }

  codeFor_updateSettings(varNameIgnore, varIndexIgnore, settingsJson) {
    try {
      let settings = [];
      for (let [settingName, settingValue] of _.toPairs(settingsJson)) {
        settings.push(`_driver.SetSetting("${settingName}", ${this.getCSharpVal(settingValue)});`);
      }
      return settings.join('\n');
    } catch (e) {
      return `// Could not parse: ${settingsJson}`;
    }
  }

  codeFor_getSettings() {
    return `let settings = _driver.Settings();`;
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

  // Context

  codeFor_getContext() {
    return `var context = _driver.Context;`;
  }

  codeFor_getContexts() {
    return `var contexts = _driver.Contexts;`;
  }

  codeFor_switchContext(varNameIgnore, varIndexIgnore, name) {
    return `_driver.Context = "${name}";`;
  }
}

DotNetNUnitFramework.readableName = '.NET - NUnit';

export default DotNetNUnitFramework;
