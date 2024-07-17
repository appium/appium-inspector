import Framework from './framework';

class JsWdIoFramework extends Framework {
  get language() {
    return 'js';
  }

  wrapWithBoilerplate(code) {
    return `// This sample code supports WebdriverIO client >=8
// (npm i --save webdriverio)
// Then paste this into a .js file and run with Node:
// node <file>.js

import {remote} from 'webdriverio';
async function main () {
  const caps = ${JSON.stringify(this.caps, null, 2)}
  const driver = await remote({
    protocol: "${this.scheme}",
    hostname: "${this.host}",
    port: ${this.port},
    path: "${this.path}",
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

  codeFor_click(varName, varIndex) {
    return `await ${this.getVarName(varName, varIndex)}.click();`;
  }

  codeFor_clear(varName, varIndex) {
    return `await ${this.getVarName(varName, varIndex)}.clearValue();`;
  }

  codeFor_sendKeys(varName, varIndex, text) {
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

  // Execute Script

  codeFor_executeScriptNoArgs(scriptCmd) {
    return `await driver.executeScript(${JSON.stringify(scriptCmd)});`;
  }

  codeFor_executeScriptWithArgs(scriptCmd, jsonArg) {
    return `await driver.executeScript(${JSON.stringify(scriptCmd)}, ${JSON.stringify(jsonArg)});`;
  }

  // App Management

  codeFor_getCurrentActivity() {
    return `let activityName = ${this.codeFor_executeScriptNoArgs('mobile: getCurrentActivity')}`;
  }

  codeFor_getCurrentPackage() {
    return `let packageName = ${this.codeFor_executeScriptNoArgs('mobile: getCurrentPackage')}`;
  }

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

  codeFor_getStrings(varNameIgnore, varIndexIgnore, language, stringFile) {
    return `let appStrings = await driver.getStrings(${language ? `"${language}", ` : ''}${
      stringFile ? `"${stringFile}"` : ''
    });`;
  }

  // Clipboard

  codeFor_getClipboard() {
    return `let clipboardText = await driver.getClipboard();`;
  }

  codeFor_setClipboard(varNameIgnore, varIndexIgnore, clipboardText) {
    return `await driver.setClipboard("${clipboardText}")`;
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

  // Device Interaction

  codeFor_isLocked() {
    return `let isLocked = ${this.codeFor_executeScriptNoArgs('mobile: isLocked')}`;
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

  codeFor_touchId(varNameIgnore, varIndexIgnore, match) {
    return `await driver.touchId(${match});`;
  }

  codeFor_toggleEnrollTouchId(varNameIgnore, varIndexIgnore, enroll) {
    return `await driver.toggleEnrollTouchId(${enroll});`;
  }

  // Keyboard

  codeFor_isKeyboardShown() {
    return `let isKeyboardShown = await driver.isKeyboardShown();`;
  }

  // Connectivity

  codeFor_toggleAirplaneMode() {
    return `await driver.toggleAirplaneMode();`;
  }

  codeFor_toggleData() {
    return `await driver.toggleData();`;
  }

  codeFor_toggleWiFi() {
    return `await driver.toggleWiFi();`;
  }

  codeFor_sendSMS(varNameIgnore, varIndexIgnore, phoneNumber, text) {
    return `await driver.sendSms("${phoneNumber}", "${text}");`;
  }

  codeFor_gsmCall(varNameIgnore, varIndexIgnore, phoneNumber, action) {
    return `await driver.gsmCall("${phoneNumber}", "${action}");`;
  }

  codeFor_gsmSignal(varNameIgnore, varIndexIgnore, signalStrength) {
    return `await driver.gsmSignal("${signalStrength}");`;
  }

  codeFor_gsmVoice(varNameIgnore, varIndexIgnore, state) {
    return `await driver.gsmVoice("${state}");`;
  }

  // Session

  codeFor_getSession() {
    return `let sessionDetails = await driver.getSession();`;
  }

  codeFor_setTimeouts(/*varNameIgnore, varIndexIgnore, timeoutsJson*/) {
    return '/* TODO implement setTimeouts */';
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

  codeFor_getLogTypes() {
    return `let logTypes = await driver.getLogTypes();`;
  }

  codeFor_getLogs(varNameIgnore, varIndexIgnore, logType) {
    return `let logs = await driver.getLogs("${logType}");`;
  }

  codeFor_updateSettings(varNameIgnore, varIndexIgnore, settingsJson) {
    return `await driver.updateSettings(${JSON.stringify(settingsJson)});`;
  }

  codeFor_getSettings() {
    return `let settings = await driver.getSettings();`;
  }

  // Web

  codeFor_navigateTo(varNameIgnore, varIndexIgnore, url) {
    return `await driver.navigateTo('${url}');`;
  }

  codeFor_getUrl() {
    return `let current_url = await driver.getUrl();`;
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

  // Context

  codeFor_getContext() {
    return `let context = await driver.getContext();`;
  }

  codeFor_getContexts() {
    return `let contexts = await driver.getContexts();`;
  }

  codeFor_switchContext(varNameIgnore, varIndexIgnore, name) {
    return `await driver.switchContext("${name}");`;
  }
}

JsWdIoFramework.readableName = 'JS - Webdriver.io';

export default JsWdIoFramework;
