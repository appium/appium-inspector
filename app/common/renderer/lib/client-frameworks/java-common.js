import _ from 'lodash';

import CommonClientFramework from './common.js';

export default class JavaFramework extends CommonClientFramework {
  static highlightLang = 'java';

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
      return `WebElements ${localVar} = driver.findElements(AppiumBy.${
        suffixMap[strategy]
      }(${JSON.stringify(locator)}));`;
    } else {
      return `WebElement ${localVar} = driver.findElement(AppiumBy.${suffixMap[strategy]}(${JSON.stringify(
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

  codeFor_elementClick(varName, varIndex) {
    return `${this.getVarName(varName, varIndex)}.click();`;
  }

  codeFor_elementClear(varName, varIndex) {
    return `${this.getVarName(varName, varIndex)}.clear();`;
  }

  codeFor_elementSendKeys(varName, varIndex, text) {
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

  // Top-Level Commands

  codeFor_executeScriptNoArgs(scriptCmd) {
    return `driver.executeScript("${scriptCmd}");`;
  }

  codeFor_executeScriptWithArgs(scriptCmd, jsonArg) {
    // Java dictionary needs to use the Map.ofEntries(Map.entry() ...) syntax
    return `driver.executeScript("${scriptCmd}", ${this.getJavaVal(jsonArg[0])});`;
  }

  codeFor_updateSettings(varNameIgnore, varIndexIgnore, settingsJson) {
    try {
      const settings = _.toPairs(settingsJson).map(
        ([settingName, settingValue]) =>
          `driver.setSetting("${settingName}", ${this.getJavaVal(settingValue)});`,
      );
      return settings.join('\n');
    } catch {
      return `// Could not parse: ${JSON.stringify(settingsJson)}`;
    }
  }

  codeFor_getSettings() {
    return `var settings = driver.getSettings();`;
  }

  // Session

  codeFor_status() {
    return `var status = driver.getStatus();`;
  }

  codeFor_getSession() {
    return `var caps = driver.getSessionDetails();`;
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
var implicitTimeout = driver.manage().timeouts().getImplicitWaitTimeout();
var pageLoadTimeout = driver.manage().timeouts().getPageLoadTimeout();
var scriptTimeout = driver.manage().timeouts().getScriptTimeout();
var timeouts = Map.ofEntries(
  Map.entry("implicit", implicitTimeout),
  Map.entry("pageLoad", pageLoadTimeout),
  Map.entry("script", scriptTimeout)
);
`;
  }

  codeFor_setTimeouts(/*varNameIgnore, varIndexIgnore, timeoutsJson*/) {
    return '/* TODO implement setTimeouts */';
  }

  codeFor_getLogTypes() {
    return `var getLogTypes = driver.manage().logs().getAvailableLogTypes();`;
  }

  codeFor_getLogs(varNameIgnore, varIndexIgnore, logType) {
    return `var logEntries = driver.manage().logs().get("${logType}");`;
  }

  // Context

  codeFor_getAppiumContext() {
    return `var context = driver.getContext();`;
  }

  codeFor_getAppiumContexts() {
    return `var contexts = driver.getContextHandles();`;
  }

  codeFor_switchAppiumContext(varNameIgnore, varIndexIgnore, name) {
    return `driver.context("${name}");`;
  }

  // Device Interaction

  codeFor_getWindowRect() {
    return `// Not supported: getWindowRect`;
  }

  codeFor_takeScreenshot() {
    return `byte[] screenshot = Base64.getEncoder().encode(driver.getScreenshotAs(OutputType.BYTES));`;
  }

  codeFor_isKeyboardShown() {
    return `var isKeyboardShown = driver.isKeyboardShown();`;
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

  // App Management

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

  codeFor_queryAppState(varNameIgnore, varIndexIgnore, app) {
    return `var appState = driver.queryAppState("${app}");`;
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

  codeFor_getTitle() {
    return `var title = driver.getTitle();`;
  }

  codeFor_getWindowHandle() {
    return `var windowHandle = driver.getWindowHandle();`;
  }

  codeFor_closeWindow() {
    return `driver.close();`;
  }

  codeFor_switchToWindow(varNameIgnore, varIndexIgnore, handle) {
    return `driver.switchTo().window("${handle}");`;
  }

  codeFor_getWindowHandles() {
    return `var windowHandles = driver.getWindowHandles();`;
  }

  codeFor_createWindow() {
    return `// Not supported: createWindow`;
  }
}
