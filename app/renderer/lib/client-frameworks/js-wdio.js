import Framework from './framework';

class JsWdIoFramework extends Framework {

  get language () {
    return 'js';
  }

  chainifyCode (code) {
    return code
      .replace(/let .+ = /g, '')
      .replace(/(\n|^)(driver|el[0-9]+)\./g, '\n.')
      .replace(/;\n/g, '\n');
  }

  wrapWithBoilerplate (code) {
    let host = JSON.stringify(this.host);
    let caps = JSON.stringify(this.caps);
    let proto = JSON.stringify(this.scheme);
    let path = JSON.stringify(this.path);
    return `// Requires the webdriverio client library
// (npm install webdriverio)
// Then paste this into a .js file and run with Node:
// node <file>.js

const wdio = require('webdriverio');
async function main () {
  const caps = ${caps}
  const driver = await wdio.remote({
    protocol: ${proto},
    hostname: ${host},
    port: ${this.port},
    path: ${path},
    capabilities: caps
  });
${this.indent(code, 2)}
  await driver.deleteSession();
}

main().catch(console.log);`;
  }

  codeFor_executeScript (/*varNameIgnore, varIndexIgnore, args*/) {
    return `/* TODO implement executeScript */`;
  }


  codeFor_findAndAssign (strategy, locator, localVar, isArray) {
    // wdio has its own way of indicating the strategy in the locator string
    switch (strategy) {
      case 'xpath': break; // xpath does not need to be updated
      case 'accessibility id': locator = `~${locator}`; break;
      case 'id': locator = `${locator}`; break;
      case 'name': locator = `name=${locator}`; break;
      case 'class name': locator = `${locator}`; break;
      case '-android uiautomator': locator = `android=${locator}`; break;
      case '-android datamatcher': locator = `android=${locator}`; break;
      case '-android viewtag': locator = `android=unsupported`; break;
      case '-ios predicate string': locator = `ios=${locator}`; break;
      case '-ios class chain': locator = `ios=${locator}`; break; // TODO: Handle IOS class chain properly. Not all libs support it. Or take it out
      default: throw new Error(`Can't handle strategy ${strategy}`);
    }
    if (isArray) {
      return `let ${localVar} = await driver.$$(${JSON.stringify(locator)});`;
    } else {
      return `let ${localVar} = await driver.$(${JSON.stringify(locator)});`;
    }
  }

  codeFor_click (varName, varIndex) {
    return `await ${this.getVarName(varName, varIndex)}.click();`;
  }

  codeFor_clear (varName, varIndex) {
    return `await ${this.getVarName(varName, varIndex)}.clearValue();`;
  }

  codeFor_sendKeys (varName, varIndex, text) {
    return `await ${this.getVarName(varName, varIndex)}.setValue(${JSON.stringify(text)});`;
  }

  codeFor_back () {
    return `await driver.back();`;
  }

  codeFor_tap (varNameIgnore, varIndexIgnore, pointerActions) {
    const {x, y} = this.getTapCoordinatesFromPointerActions(pointerActions);

    return `await driver.touchAction({actions: 'tap', x: ${x}, y: ${y}})`;
  }

  codeFor_swipe (varNameIgnore, varIndexIgnore, pointerActions) {
    const {x1, y1, x2, y2} = this.getSwipeCoordinatesFromPointerActions(pointerActions);

    return `await driver.touchAction([
  {action: 'press', x: ${x1}, y: ${y1}},
  {action: 'moveTo', x: ${x2}, y: ${y2}},
  'release'
]);`;
  }

  codeFor_getCurrentActivity () {
    return `let activityName = await driver.getCurrentActivity();`;
  }

  codeFor_getCurrentPackage () {
    return `let packageName = await driver.getCurrentPackage();`;
  }


  codeFor_installApp (varNameIgnore, varIndexIgnore, app) {
    return `await driver.installApp('${app}');`;
  }

  codeFor_isAppInstalled (varNameIgnore, varIndexIgnore, app) {
    return `let isAppInstalled = await driver.isAppInstalled("${app}");`;
  }

  codeFor_launchApp () {
    return `await driver.launchApp();`;
  }

  codeFor_background (varNameIgnore, varIndexIgnore, timeout) {
    return `await driver.background(${timeout});`;
  }

  codeFor_closeApp () {
    return `await driver.closeApp();`;
  }

  codeFor_reset () {
    return `await driver.reset();`;
  }

  codeFor_removeApp (varNameIgnore, varIndexIgnore, app) {
    return `await driver.removeApp('${app}')`;
  }

  codeFor_getStrings (varNameIgnore, varIndexIgnore, language, stringFile) {
    return `let appStrings = await driver.getStrings(${language ? `${language}, ` : ''}${stringFile ? `"${stringFile}` : ''});`;
  }

  codeFor_getClipboard (varNameIgnore, varIndexIgnore, contentType) {
    return `let clipboardText = await driver.getClipboard(${contentType ? `${contentType}, ` : ''});`;
  }

  codeFor_setClipboard (varNameIgnore, varIndexIgnore, clipboardText) {
    return `await driver.setClipboard('${clipboardText}')`;
  }

  codeFor_pressKeyCode (varNameIgnore, varIndexIgnore, keyCode, metaState, flags) {
    return `await driver.longPressKeyCode(${keyCode}, ${metaState}, ${flags});`;
  }

  codeFor_longPressKeyCode (varNameIgnore, varIndexIgnore, keyCode, metaState, flags) {
    return `await driver.longPressKeyCode(${keyCode}, ${metaState}, ${flags});`;
  }

  codeFor_hideKeyboard () {
    return `await driver.hideKeyboard();`;
  }

  codeFor_isKeyboardShown () {
    return `let isKeyboardShown = await driver.isKeyboardShown();`;
  }

  codeFor_pushFile (varNameIgnore, varIndexIgnore, pathToInstallTo, fileContentString) {
    return `await driver.pushFile('${pathToInstallTo}', '${fileContentString}');`;
  }

  codeFor_pullFile (varNameIgnore, varIndexIgnore, pathToPullFrom) {
    return `let data = await driver.pullFile('${pathToPullFrom}');`;
  }

  codeFor_pullFolder (varNameIgnore, varIndexIgnore, folderToPullFrom) {
    return `let data = await driver.pullFolder('${folderToPullFrom}');`;
  }

  codeFor_toggleAirplaneMode () {
    return `await driver.toggleAirplaneMode();`;
  }

  codeFor_toggleData () {
    return `await driver.toggleData();`;
  }

  codeFor_toggleWiFi () {
    return `await driver.toggleWiFi();`;
  }

  codeFor_toggleLocationServices () {
    return `await driver.toggleLocationServices();`;
  }

  codeFor_sendSMS (varNameIgnore, varIndexIgnore, phoneNumber, text) {
    return `await driver.sendSms("${phoneNumber}", "${text}");`;
  }

  codeFor_gsmCall (varNameIgnore, varIndexIgnore, phoneNumber, action) {
    return `await driver.gsmCall("${phoneNumber}", "${action}");`;
  }

  codeFor_gsmSignal (varNameIgnore, varIndexIgnore, signalStrength) {
    return `await driver.gsmSignal("${signalStrength}");`;
  }

  codeFor_gsmVoice (varNameIgnore, varIndexIgnore, state) {
    return `await driver.gsmVoice("${state}");`;
  }

  codeFor_shake () {
    return `await driver.shake();`;
  }

  codeFor_lock (varNameIgnore, varIndexIgnore, seconds) {
    return `await driver.lock(${seconds});`;
  }

  codeFor_unlock () {
    return `await driver.unlock();`;
  }

  codeFor_isLocked () {
    return `let isLocked = await driver.isLocked();`;
  }

  codeFor_rotateDevice (varNameIgnore, varIndexIgnore, x, y, radius, rotation, touchCount, duration) {
    return `await driver.rotateDevice(${x}, ${y}, ${radius}, ${rotation}, ${touchCount}, ${duration});`;
  }

  codeFor_getPerformanceData (varNameIgnore, varIndexIgnore, packageName, dataType, dataReadTimeout) {
    return `let performanceData = driver.getPerformanceData("${packageName}", "${dataType}", ${dataReadTimeout});`;
  }

  codeFor_getPerformanceDataTypes () {
    return `let performanceDataTypes = await driver.getPerformanceDataTypes()`;
  }

  codeFor_touchId (varNameIgnore, varIndexIgnore, match) {
    return `await driver.touchId(${match});`;
  }

  codeFor_toggleEnrollTouchId (varNameIgnore, varIndexIgnore, enroll) {
    return `await driver.toggleEnrollTouchId(${enroll});`;
  }

  codeFor_openNotifications () {
    return `await driver.openNotifications();`;
  }

  codeFor_getDeviceTime () {
    return `let time = await driver.getDeviceTime();`;
  }

  codeFor_fingerprint (varNameIgnore, varIndexIgnore, fingerprintId) {
    return `await driver.fingerprint(${fingerprintId});`;
  }

  codeFor_getSession () {
    return `let caps = await driver.getSession();`;
  }

  codeFor_setTimeouts (/*varNameIgnore, varIndexIgnore, timeoutsJson*/) {
    return '/* TODO implement setTimeouts */';
  }

  codeFor_setCommandTimeout (/*varNameIgnore, varIndexIgnore, ms*/) {
    return `// Not supported: setCommandTimeout`;
  }

  codeFor_getOrientation () {
    return `let orientation = await driver.getOrientation();`;
  }

  codeFor_setOrientation (varNameIgnore, varIndexIgnore, orientation) {
    return `await driver.setOrientation("${orientation}");`;
  }

  codeFor_getGeoLocation () {
    return `let location = await driver.getGeoLocation();`;
  }

  codeFor_setGeoLocation (varNameIgnore, varIndexIgnore, latitude, longitude, altitude) {
    return `await driver.setGeoLocation({latitude: ${latitude}, longitude: ${longitude}, altitude: ${altitude}});`;
  }

  codeFor_getLogTypes () {
    return `let getLogTypes = await driver.getLogTypes();`;
  }

  codeFor_getLogs (varNameIgnore, varIndexIgnore, logType) {
    return `let logs = await driver.getLogs('${logType}');`;
  }

  codeFor_updateSettings (varNameIgnore, varIndexIgnore, settingsJson) {
    return `await driver.updateSettings(${settingsJson});`;
  }

  codeFor_getSettings () {
    return `let settings = await driver.getSettings();`;
  }

  // Web

  codeFor_navigateTo (varNameIgnore, varIndexIgnore, url) {
    return `await driver.navigateTo('${url}');`;
  }

  codeFor_getUrl () {
    return `let current_url = await driver.getUrl();`;
  }

  codeFor_forward () {
    return `await driver.forward();`;
  }

  codeFor_refresh () {
    return `await driver.refresh();`;
  }

  // Context

  codeFor_getContext () {
    return `let context = await driver.getContext();`;
  }

  codeFor_getContexts () {
    return `let contexts = await driver.getContexts();`;
  }

  codeFor_switchContext (varNameIgnore, varIndexIgnore, name) {
    return `await driver.switchContext('${name}');`;
  }
}

JsWdIoFramework.readableName = 'JS - Webdriver.io';

export default JsWdIoFramework;
