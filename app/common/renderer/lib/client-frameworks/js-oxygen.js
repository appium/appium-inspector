import CommonClientFramework from './common.js';

export default class JsOxygenFramework extends CommonClientFramework {
  static readableName = 'JS - Oxygen HQ';
  static highlightLang = 'js';

  get type() {
    if (this.caps?.platformName && this.caps.platformName.toLowerCase() === 'windows') {
      return 'win';
    }
    return 'mob';
  }

  wrapWithBoilerplate(code) {
    return `// This sample code uses the Oxygen HQ client library
// (npm install oxygen-cli -g)
// Then paste this into a .js file and run with:
// oxygen <file>.js

const caps = ${JSON.stringify(this.caps, null, 2)};
const appiumUrl = "${this.serverUrl}";
${this.type}.init(caps, appiumUrl);

${code}`;
  }

  addComment(comment) {
    return `// ${comment}`;
  }

  codeFor_findAndAssign(strategy, locator, localVar, isArray) {
    // oxygen internally uses wdio for element search
    const validStrategies = [
      'xpath',
      'accessibility id',
      'id',
      'class name',
      'name',
      '-android uiautomator',
      '-android datamatcher',
      '-android viewtag',
      '-ios predicate string',
      '-ios class chain',
    ];
    if (!validStrategies.includes(strategy)) {
      return this.handleUnsupportedLocatorStrategy(strategy, locator);
    }
    if (isArray) {
      return `const ${localVar} = ${this.type}.findElements(${JSON.stringify(
        `${strategy}:${locator}`,
      )});`;
    } else {
      return `const ${localVar} = ${this.type}.findElement(${JSON.stringify(
        `${strategy}:${locator}`,
      )});`;
    }
  }

  codeFor_elementClick(varName, varIndex) {
    return `${this.type}.click(${this.getVarName(varName, varIndex)});`;
  }

  codeFor_elementClear(varName, varIndex) {
    return `${this.type}.clear(${this.getVarName(varName, varIndex)});`;
  }

  codeFor_elementSendKeys(varName, varIndex, text) {
    return `${this.type}.type(${this.getVarName(varName, varIndex)}, ${JSON.stringify(text)});`;
  }

  codeFor_tap(varNameIgnore, varIndexIgnore, pointerActions) {
    const {x, y} = this.getTapCoordinatesFromPointerActions(pointerActions);
    return `${this.type}.tap(${x}, ${y});`;
  }

  codeFor_swipe(varNameIgnore, varIndexIgnore, pointerActions) {
    const {x1, y1, x2, y2} = this.getSwipeCoordinatesFromPointerActions(pointerActions);
    return `${this.type}.swipeScreen(${x1}, ${y1}, ${x2}, ${y2});`;
  }

  // Top-Level Commands

  codeFor_executeScriptNoArgs(scriptCmd) {
    return `${this.type}.getDriver().executeScript(${JSON.stringify(scriptCmd)});`;
  }

  codeFor_executeScriptWithArgs(scriptCmd, jsonArg) {
    return `${this.type}.getDriver().executeScript(${JSON.stringify(scriptCmd)}, ${JSON.stringify(
      jsonArg,
    )});`;
  }

  codeFor_updateSettings(varNameIgnore, varIndexIgnore, settingsJson) {
    return `${this.type}.getDriver().updateSettings(${JSON.stringify(settingsJson)});`;
  }

  codeFor_getSettings() {
    return `let settings = ${this.type}.getDriver().getSettings();`;
  }

  // Session

  codeFor_status() {
    return `let status = ${this.type}.getDriver().status();`;
  }

  codeFor_getSession() {
    return `let caps = ${this.type}.getDriver().getSession();`;
  }

  codeFor_getAppiumCommands() {
    return `let appiumCommands = ${this.type}.getDriver().getAppiumCommands();`;
  }

  codeFor_getAppiumExtensions() {
    return `let appiumExtensions = ${this.type}.getDriver().getAppiumExtensions();`;
  }

  codeFor_getAppiumSessionCapabilities() {
    return `let sessionCaps = ${this.type}.getDriver().getAppiumSessionCapabilities();`;
  }

  codeFor_getTimeouts() {
    return `let timeouts = ${this.type}.getDriver().getTimeouts();`;
  }

  codeFor_setTimeouts(/*varNameIgnore, varIndexIgnore, timeoutsJson*/) {
    return '/* TODO implement setTimeouts */';
  }

  codeFor_getLogTypes() {
    return `let getLogTypes = ${this.type}.getDriver().getLogTypes();`;
  }

  codeFor_getLogs(varNameIgnore, varIndexIgnore, logType) {
    return `let logs = ${this.type}.getDriver().getLogs("${logType}");`;
  }

  // Context

  codeFor_getAppiumContext() {
    return `let context = ${this.type}.getDriver().getContext();`;
  }

  codeFor_getAppiumContexts() {
    return `let contexts = ${this.type}.getDriver().getContexts();`;
  }

  codeFor_switchAppiumContext(varNameIgnore, varIndexIgnore, name) {
    return `${this.type}.setContext("${name}");`;
  }

  // Device Interaction

  codeFor_getWindowRect() {
    return `let windowRect = ${this.type}.getDriver().getWindowRect();`;
  }

  codeFor_takeScreenshot() {
    return `let screenshot = ${this.type}.takeScreenshot();`;
  }

  codeFor_isKeyboardShown() {
    return `let isKeyboardShown = ${this.type}.getDriver().isKeyboardShown();`;
  }

  codeFor_getOrientation() {
    return `let orientation = ${this.type}.getDriver().getOrientation();`;
  }

  codeFor_setOrientation(varNameIgnore, varIndexIgnore, orientation) {
    return `${this.type}.getDriver().setOrientation("${orientation}");`;
  }

  codeFor_getGeoLocation() {
    return `let location = ${this.type}.getDriver().getGeoLocation();`;
  }

  codeFor_setGeoLocation(varNameIgnore, varIndexIgnore, latitude, longitude, altitude) {
    return `${this.type}.getDriver().setGeoLocation({latitude: ${latitude}, longitude: ${longitude}, altitude: ${altitude}});`;
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
    return `${this.type}.getDriver().rotateDevice({x: ${x}, y: ${y}, duration: ${duration}, radius: ${radius}, rotation: ${rotation}, touchCount: ${touchCount}});`;
  }

  // App Management

  codeFor_installApp(varNameIgnore, varIndexIgnore, app) {
    return `${this.type}.installApp("${app}");`;
  }

  codeFor_isAppInstalled(varNameIgnore, varIndexIgnore, app) {
    return `let isAppInstalled = ${this.type}.isAppInstalled("${app}");`;
  }

  codeFor_activateApp(varNameIgnore, varIndexIgnore, app) {
    return `${this.type}.getDriver().activateApp("${app}");`;
  }

  codeFor_terminateApp(varNameIgnore, varIndexIgnore, app) {
    return `${this.type}.getDriver().terminateApp("${app}");`;
  }

  codeFor_removeApp(varNameIgnore, varIndexIgnore, app) {
    return `${this.type}.removeApp("${app}")`;
  }

  codeFor_queryAppState(varNameIgnore, varIndexIgnore, app) {
    return `let appState = ${this.type}.getDriver().queryAppState("${app}");`;
  }

  // File Transfer

  codeFor_pushFile(varNameIgnore, varIndexIgnore, pathToInstallTo, fileContentString) {
    return `${this.type}.getDriver().pushFile("${pathToInstallTo}", "${fileContentString}");`;
  }

  codeFor_pullFile(varNameIgnore, varIndexIgnore, pathToPullFrom) {
    return `let fileBase64 = ${this.type}.getDriver().pullFile("${pathToPullFrom}");`;
  }

  codeFor_pullFolder(varNameIgnore, varIndexIgnore, folderToPullFrom) {
    return `let fileBase64 = ${this.type}.getDriver().pullFolder("${folderToPullFrom}");`;
  }

  // Web

  codeFor_navigateTo(varNameIgnore, varIndexIgnore, url) {
    return `${this.type}.open("${url}");`;
  }

  codeFor_getUrl() {
    return `let currentUrl = ${this.type}.getUrl();`;
  }

  codeFor_back() {
    return `${this.type}.back();`;
  }

  codeFor_forward() {
    return `${this.type}.getDriver().forward();`;
  }

  codeFor_refresh() {
    return `${this.type}.getDriver().refresh();`;
  }

  codeFor_getTitle() {
    return `let title = ${this.type}.getTitle();`;
  }

  codeFor_getWindowHandle() {
    return `let windowHandle = ${this.type}.getDriver().getWindowHandle();`;
  }

  codeFor_closeWindow() {
    return `${this.type}.closeWindow();`;
  }

  codeFor_switchToWindow(varNameIgnore, varIndexIgnore, handle) {
    return `${this.type}.selectWindow("${handle}");`;
  }

  codeFor_getWindowHandles() {
    return `let windowHandles = ${this.type}.getWindowHandles();`;
  }

  codeFor_createWindow(varNameIgnore, varIndexIgnore, type) {
    return `let newWindow = await ${this.type}.getDriver().createWindow("${type}");`;
  }
}
