import _ from 'lodash';

import Framework from './framework';

class JavaFramework extends Framework {
  get language() {
    return 'java';
  }

  getJavaVal(jsonVal) {
    if (Array.isArray(jsonVal)) {
      const convertedItems = jsonVal.map((item) => this.getJavaVal(item));
      return `{${convertedItems.join(', ')}}`;
    } else if (typeof jsonVal === 'object') {
      const cleanedJson = _.omitBy(jsonVal, _.isUndefined);
      const convertedItems = _.map(
        cleanedJson,
        (v, k) => `Map.entry(${JSON.stringify(k)}, ${this.getJavaVal(v)})`,
      );
      return `Map.ofEntries(${convertedItems.join(', ')})`;
    }
    return JSON.stringify(jsonVal);
  }

  getBoilerplateParams() {
    const [pkg, cls] = (() => {
      if (this.caps.platformName) {
        switch (this.caps.platformName.toLowerCase()) {
          case 'ios':
            return ['ios', 'IOSDriver'];
          case 'android':
            return ['android', 'AndroidDriver'];
          case 'windows':
            return ['windows', 'WindowsDriver'];
          case 'mac2':
            return ['mac', 'Mac2Driver'];
          case 'gecko':
            return ['gecko', 'GeckoDriver'];
          case 'safari':
            return ['safari', 'SafariDriver'];
          default:
            return ['unknownPlatform', 'UnknownDriver'];
        }
      } else {
        return ['unknownPlatform', 'UnknownDriver'];
      }
    })();
    const capStr = this.indent(
      _.map(this.caps, (v, k) => `.amend(${JSON.stringify(k)}, ${this.getJavaVal(v)})`).join('\n'),
      6,
    );
    return [pkg, cls, capStr];
  }

  addComment(comment) {
    return `// ${comment}`;
  }

  codeFor_findAndAssign(strategy, locator, localVar, isArray) {
    let suffixMap = {
      xpath: 'xpath',
      'accessibility id': 'accessibilityId',
      id: 'id',
      'class name': 'className',
      name: 'name',
      '-android uiautomator': 'androidUIAutomator',
      '-android datamatcher': 'androidDataMatcher',
      '-android viewtag': 'androidViewTag',
      '-ios predicate string': 'iOSNsPredicateString',
      '-ios class chain': 'iOSClassChain',
    };
    if (!suffixMap[strategy]) {
      return this.handleUnsupportedLocatorStrategy(strategy, locator);
    }
    if (isArray) {
      return `var ${localVar} = driver.findElements(AppiumBy.${
        suffixMap[strategy]
      }(${JSON.stringify(locator)}));`;
    } else {
      return `var ${localVar} = driver.findElement(AppiumBy.${suffixMap[strategy]}(${JSON.stringify(
        locator,
      )}));`;
    }
  }

  getVarName(varName, varIndex) {
    if (varIndex || varIndex === 0) {
      return `${varName}.get(${varIndex})`;
    }
    return varName;
  }

  codeFor_click(varName, varIndex) {
    return `${this.getVarName(varName, varIndex)}.click();`;
  }

  codeFor_clear(varName, varIndex) {
    return `${this.getVarName(varName, varIndex)}.clear();`;
  }

  codeFor_sendKeys(varName, varIndex, text) {
    return `${this.getVarName(varName, varIndex)}.sendKeys(${JSON.stringify(text)});`;
  }

  codeFor_tap(varNameIgnore, varIndexIgnore, pointerActions) {
    const {x, y} = this.getTapCoordinatesFromPointerActions(pointerActions);
    return `
final var finger = new PointerInput(PointerInput.Kind.TOUCH, "finger");
var tapPoint = new Point(${x}, ${y});
var tap = new Sequence(finger, 1);
tap.addAction(finger.createPointerMove(Duration.ofMillis(0),
    PointerInput.Origin.viewport(), tapPoint.x, tapPoint.y));
tap.addAction(finger.createPointerDown(PointerInput.MouseButton.LEFT.asArg()));
tap.addAction(new Pause(finger, Duration.ofMillis(50)));
tap.addAction(finger.createPointerUp(PointerInput.MouseButton.LEFT.asArg()));
driver.perform(Arrays.asList(tap));
    `;
  }

  codeFor_swipe(varNameIgnore, varIndexIgnore, pointerActions) {
    const {x1, y1, x2, y2} = this.getSwipeCoordinatesFromPointerActions(pointerActions);
    return `
final var finger = new PointerInput(PointerInput.Kind.TOUCH, "finger");
var start = new Point(${x1}, ${y1});
var end = new Point (${x2}, ${y2});
var swipe = new Sequence(finger, 1);
swipe.addAction(finger.createPointerMove(Duration.ofMillis(0),
    PointerInput.Origin.viewport(), start.getX(), start.getY()));
swipe.addAction(finger.createPointerDown(PointerInput.MouseButton.LEFT.asArg()));
swipe.addAction(finger.createPointerMove(Duration.ofMillis(1000),
    PointerInput.Origin.viewport(), end.getX(), end.getY()));
swipe.addAction(finger.createPointerUp(PointerInput.MouseButton.LEFT.asArg()));
driver.perform(Arrays.asList(swipe));
  `;
  }

  // Execute Script

  codeFor_executeScriptNoArgs(scriptCmd) {
    return `driver.executeScript("${scriptCmd}");`;
  }

  codeFor_executeScriptWithArgs(scriptCmd, jsonArg) {
    // Java dictionary needs to use the Map.ofEntries(Map.entry() ...) syntax
    return `driver.executeScript("${scriptCmd}", ${this.getJavaVal(jsonArg[0])};`;
  }

  // App Management

  codeFor_getCurrentActivity() {
    return `var activityName = ${this.codeFor_executeScriptNoArgs('mobile: getCurrentActivity')}`;
  }

  codeFor_getCurrentPackage() {
    return `var packageName = ${this.codeFor_executeScriptNoArgs('mobile: getCurrentPackage')}`;
  }

  codeFor_installApp(varNameIgnore, varIndexIgnore, app) {
    return `driver.installApp("${app}");`;
  }

  codeFor_isAppInstalled(varNameIgnore, varIndexIgnore, app) {
    return `var isAppInstalled = driver.isAppInstalled("${app}");`;
  }

  codeFor_activateApp(varNameIgnore, varIndexIgnore, app) {
    return `driver.activateApp("${app}");`;
  }

  codeFor_terminateApp(varNameIgnore, varIndexIgnore, app) {
    return `driver.terminateApp("${app}");`;
  }

  codeFor_removeApp(varNameIgnore, varIndexIgnore, app) {
    return `driver.removeApp("${app}");`;
  }

  codeFor_getStrings(varNameIgnore, varIndexIgnore, language, stringFile) {
    return `var appStrings = driver.getAppStringMap(${language ? `${language}, ` : ''}${
      stringFile ? `"${stringFile}` : ''
    });`;
  }

  // Clipboard

  codeFor_getClipboard() {
    return `var clipboardText = driver.getClipboardText();`;
  }

  codeFor_setClipboard(varNameIgnore, varIndexIgnore, clipboardText) {
    return `driver.setClipboardText("${clipboardText}");`;
  }

  // File Transfer

  codeFor_pushFile(varNameIgnore, varIndexIgnore, pathToInstallTo, fileContentString) {
    return `driver.pushFile("${pathToInstallTo}", ${fileContentString});`;
  }

  codeFor_pullFile(varNameIgnore, varIndexIgnore, pathToPullFrom) {
    return `var fileBase64 = driver.pullFile("${pathToPullFrom}");`;
  }

  codeFor_pullFolder(varNameIgnore, varIndexIgnore, folderToPullFrom) {
    return `var folderBase64 = driver.pullFolder("${folderToPullFrom}");`;
  }

  // Device Interaction

  codeFor_isLocked() {
    return `var isLocked = ${this.codeFor_executeScriptNoArgs('mobile: isLocked')}`;
  }

  codeFor_rotateDevice(
    varNameIgnore,
    varIndexIgnore,
    x,
    y,
    radius,
    rotation,
    touchCount,
    duration,
  ) {
    return `driver.rotate(new DeviceRotation(${x}, ${y}, ${radius}, ${rotation}, ${touchCount}, ${duration}));`;
  }

  codeFor_touchId(varNameIgnore, varIndexIgnore, match) {
    return `driver.performTouchID(${match});`;
  }

  codeFor_toggleEnrollTouchId(varNameIgnore, varIndexIgnore, enroll) {
    return `driver.toggleTouchIDEnrollment(${enroll});`;
  }

  // Keyboard

  codeFor_isKeyboardShown() {
    return `var isKeyboardShown = driver.isKeyboardShown();`;
  }

  // Connectivity

  codeFor_toggleAirplaneMode() {
    return `driver.toggleAirplaneMode();`;
  }

  codeFor_toggleData() {
    return `driver.toggleData();`;
  }

  codeFor_toggleWiFi() {
    return `driver.toggleWifi();`;
  }

  codeFor_sendSMS(varNameIgnore, varIndexIgnore, phoneNumber, text) {
    return `driver.sendSMS("${phoneNumber}", "${text}");`;
  }

  codeFor_gsmCall(varNameIgnore, varIndexIgnore, phoneNumber, action) {
    return `driver.makeGsmCall("${phoneNumber}", "${action}");`;
  }

  codeFor_gsmSignal(varNameIgnore, varIndexIgnore, signalStrength) {
    return `driver.setGsmSignalStrength("${signalStrength}");`;
  }

  codeFor_gsmVoice(varNameIgnore, varIndexIgnore, state) {
    return `driver.setGsmVoice("${state}");`;
  }

  // Session

  codeFor_getSession() {
    return `var caps = driver.getSessionDetails();`;
  }

  codeFor_setTimeouts(/*varNameIgnore, varIndexIgnore, timeoutsJson*/) {
    return '/* TODO implement setTimeouts */';
  }

  codeFor_getOrientation() {
    return `var orientation = driver.getOrientation();`;
  }

  codeFor_setOrientation(varNameIgnore, varIndexIgnore, orientation) {
    return `driver.rotate("${orientation}");`;
  }

  codeFor_getGeoLocation() {
    return `var location = driver.location();`;
  }

  codeFor_setGeoLocation(varNameIgnore, varIndexIgnore, latitude, longitude, altitude) {
    return `driver.setLocation(new Location(${latitude}, ${longitude}, ${altitude}));`;
  }

  codeFor_getLogTypes() {
    return `var getLogTypes = driver.manage().logs().getAvailableLogTypes();`;
  }

  codeFor_getLogs(varNameIgnore, varIndexIgnore, logType) {
    return `var logEntries = driver.manage().logs().get("${logType}");`;
  }

  codeFor_updateSettings(varNameIgnore, varIndexIgnore, settingsJson) {
    try {
      let settings = [];
      for (let [settingName, settingValue] of _.toPairs(settingsJson)) {
        settings.push(`driver.setSetting("${settingName}", ${this.getJavaVal(settingValue)});`);
      }
      return settings.join('\n');
    } catch (e) {
      return `// Could not parse: ${settingsJson}`;
    }
  }

  codeFor_getSettings() {
    return `var settings = driver.getSettings();`;
  }

  // Web

  codeFor_navigateTo(varNameIgnore, varIndexIgnore, url) {
    return `driver.get("${url}");`;
  }

  codeFor_getUrl() {
    return `var currentUrl = driver.getCurrentUrl();`;
  }

  codeFor_back() {
    return `driver.navigate().back();`;
  }

  codeFor_forward() {
    return `driver.navigate().forward();`;
  }

  codeFor_refresh() {
    return `driver.navigate().refresh();`;
  }

  // Context

  codeFor_getContext() {
    return `var context = driver.getContext();`;
  }

  codeFor_getContexts() {
    return `var contexts = driver.getContextHandles();`;
  }

  codeFor_switchContext(varNameIgnore, varIndexIgnore, name) {
    return `driver.context("${name}");`;
  }
}

export default JavaFramework;
