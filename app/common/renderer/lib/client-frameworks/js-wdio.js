import CommonClientFramework from './common.js';

export default class JsWdIoFramework extends CommonClientFramework {
  static readableName = 'JS - WebdriverIO';
  static highlightLang = 'js';

  wrapWithBoilerplate(code) {
    return `// This sample code supports WebdriverIO client >=9.7.0
// (npm i --save webdriverio)
// Then paste this into a .js file and run with Node:
// node <file>.js

import {remote} from 'webdriverio';
async function main () {
  const caps = ${JSON.stringify(this.caps, null, 2)}
  const driver = await remote({
    protocol: "${this.serverUrlParts.protocol}",
    hostname: "${this.serverUrlParts.host}",
    port: ${this.serverUrlParts.port},
    path: "${this.serverUrlParts.path}",
    capabilities: caps
  });
${this.indent(code, 2)}
  await driver.deleteSession();
}

main().catch(console.log);`;
  }

  addComment(comment) {
    return `// ${comment}`;
  }

  codeFor_findAndAssign(strategy, locator, localVar, isArray) {
    // wdio allows to specify strategy as a locator prefix
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
      return `const ${localVar} = await driver.$$(${JSON.stringify(`${strategy}:${locator}`)});`;
    } else {
      return `const ${localVar} = await driver.$(${JSON.stringify(`${strategy}:${locator}`)});`;
    }
  }

  codeFor_elementClick(varName, varIndex) {
    return `await ${this.getVarName(varName, varIndex)}.click();`;
  }

  codeFor_elementClear(varName, varIndex) {
    return `await ${this.getVarName(varName, varIndex)}.clearValue();`;
  }

  codeFor_elementSendKeys(varName, varIndex, text) {
    return `await ${this.getVarName(varName, varIndex)}.addValue(${JSON.stringify(text)});`;
  }

  codeFor_tap(varNameIgnore, varIndexIgnore, pointerActions) {
    const {x, y} = this.getTapCoordinatesFromPointerActions(pointerActions);
    return `await driver.action('pointer')
  .move({ duration: 0, x: ${x}, y: ${y} })
  .down({ button: 0 })
  .pause(50)
  .up({ button: 0 })
  .perform();
`;
  }

  codeFor_swipe(varNameIgnore, varIndexIgnore, pointerActions) {
    const {x1, y1, x2, y2} = this.getSwipeCoordinatesFromPointerActions(pointerActions);
    return `await driver.action('pointer')
  .move({ duration: 0, x: ${x1}, y: ${y1} })
  .down({ button: 0 })
  .move({ duration: 1000, x: ${x2}, y: ${y2} })
  .up({ button: 0 })
  .perform();
`;
  }

  // Top-Level Commands

  codeFor_executeScriptNoArgs(scriptCmd) {
    return `await driver.executeScript(${JSON.stringify(scriptCmd)});`;
  }

  codeFor_executeScriptWithArgs(scriptCmd, jsonArg) {
    return `await driver.executeScript(${JSON.stringify(scriptCmd)}, ${JSON.stringify(jsonArg)});`;
  }

  codeFor_updateSettings(varNameIgnore, varIndexIgnore, settingsJson) {
    return `await driver.updateSettings(${JSON.stringify(settingsJson)});`;
  }

  codeFor_getSettings() {
    return `let settings = await driver.getSettings();`;
  }

  // Session

  codeFor_status() {
    return `let status = await driver.status();`;
  }

  codeFor_getSession() {
    return `let sessionDetails = await driver.getSession();`;
  }

  codeFor_getAppiumCommands() {
    return `let appiumCommands = await driver.getAppiumCommands();`;
  }

  codeFor_getAppiumExtensions() {
    return `let appiumExtensions = await driver.getAppiumExtensions();`;
  }

  codeFor_getAppiumSessionCapabilities() {
    return `let sessionCaps = await driver.getAppiumSessionCapabilities();`;
  }

  codeFor_getTimeouts() {
    return `let timeouts = await driver.getTimeouts();`;
  }

  codeFor_setTimeouts(/*varNameIgnore, varIndexIgnore, timeoutsJson*/) {
    return '/* TODO implement setTimeouts */';
  }

  codeFor_getLogTypes() {
    return `let logTypes = await driver.getLogTypes();`;
  }

  codeFor_getLogs(varNameIgnore, varIndexIgnore, logType) {
    return `let logs = await driver.getLogs("${logType}");`;
  }

  // Context

  codeFor_getAppiumContext() {
    return `let context = await driver.getAppiumContext();`;
  }

  codeFor_getAppiumContexts() {
    return `let contexts = await driver.getAppiumContexts();`;
  }

  codeFor_switchAppiumContext(varNameIgnore, varIndexIgnore, name) {
    return `await driver.switchAppiumContext("${name}");`;
  }

  // Device Interaction

  codeFor_getWindowRect() {
    return `let windowRect = await driver.getWindowRect();`;
  }

  codeFor_takeScreenshot() {
    return `let screenshot = await driver.takeScreenshot();`;
  }

  codeFor_isKeyboardShown() {
    return `let isKeyboardShown = await driver.isKeyboardShown();`;
  }

  codeFor_getOrientation() {
    return `let orientation = await driver.getOrientation();`;
  }

  codeFor_setOrientation(varNameIgnore, varIndexIgnore, orientation) {
    return `await driver.setOrientation("${orientation}");`;
  }

  codeFor_getGeoLocation() {
    return `let location = await driver.getGeoLocation();`;
  }

  codeFor_setGeoLocation(varNameIgnore, varIndexIgnore, latitude, longitude, altitude) {
    return `await driver.setGeoLocation({latitude: ${latitude}, longitude: ${longitude}, altitude: ${altitude}});`;
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
    return `await driver.rotateDevice(${x}, ${y}, ${radius}, ${rotation}, ${touchCount}, ${duration});`;
  }

  // App Management

  codeFor_installApp(varNameIgnore, varIndexIgnore, app) {
    return `await driver.installApp("${app}");`;
  }

  codeFor_isAppInstalled(varNameIgnore, varIndexIgnore, app) {
    return `let isAppInstalled = await driver.isAppInstalled("${app}");`;
  }

  codeFor_activateApp(varNameIgnore, varIndexIgnore, app) {
    return `await driver.activateApp("${app}");`;
  }

  codeFor_terminateApp(varNameIgnore, varIndexIgnore, app) {
    return `await driver.terminateApp("${app}");`;
  }

  codeFor_removeApp(varNameIgnore, varIndexIgnore, app) {
    return `await driver.removeApp("${app}")`;
  }

  codeFor_queryAppState(varNameIgnore, varIndexIgnore, app) {
    return `let appState = await driver.queryAppState("${app}");`;
  }

  // File Transfer

  codeFor_pushFile(varNameIgnore, varIndexIgnore, pathToInstallTo, fileContentString) {
    return `await driver.pushFile("${pathToInstallTo}", "${fileContentString}");`;
  }

  codeFor_pullFile(varNameIgnore, varIndexIgnore, pathToPullFrom) {
    return `let fileBase64 = await driver.pullFile("${pathToPullFrom}");`;
  }

  codeFor_pullFolder(varNameIgnore, varIndexIgnore, folderToPullFrom) {
    return `let folderBase64 = await driver.pullFolder("${folderToPullFrom}");`;
  }

  // Web

  codeFor_navigateTo(varNameIgnore, varIndexIgnore, url) {
    return `await driver.navigateTo('${url}');`;
  }

  codeFor_getUrl() {
    return `let currentUrl = await driver.getUrl();`;
  }

  codeFor_back() {
    return `await driver.back();`;
  }

  codeFor_forward() {
    return `await driver.forward();`;
  }

  codeFor_refresh() {
    return `await driver.refresh();`;
  }

  codeFor_getTitle() {
    return `let title = await driver.getTitle();`;
  }

  codeFor_getWindowHandle() {
    return `let windowHandle = await driver.getWindowHandle();`;
  }

  codeFor_closeWindow() {
    return `await driver.closeWindow();`;
  }

  codeFor_switchToWindow(varNameIgnore, varIndexIgnore, handle) {
    return `await driver.switchToWindow("${handle}");`;
  }

  codeFor_getWindowHandles() {
    return `let windowHandles = await driver.getWindowHandles();`;
  }

  codeFor_createWindow(varNameIgnore, varIndexIgnore, type) {
    return `let newWindow = await driver.createWindow("${type}");`;
  }
}
