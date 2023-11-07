import Framework from './framework';

class JsOxygenFramework extends Framework {

  get language () {
    return 'js';
  }

  get type () {
    if (this.caps && this.caps.platformName &&
        this.caps.platformName.toLowerCase() === 'windows') {
      return 'win';
    }
    return 'mob';
  }

  wrapWithBoilerplate (code) {
    return `// This sample code uses the Oxygen HQ client library
// (npm install oxygen-cli -g)
// Then paste this into a .js file and run with:
// oxygen <file>.js

const caps = ${JSON.stringify(this.caps)};
const appiumUrl = "${this.serverUrl}";
${this.type}.init(caps, appiumUrl);

${code}`;
  }

  addComment(comment) {
    return `// ${comment}`;
  }

  codeFor_findAndAssign (strategy, locator, localVar, isArray) {
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
      '-ios class chain'
    ];
    if (!validStrategies.includes(strategy)) {
      return this.handleUnsupportedLocatorStrategy(strategy, locator);
    }
    if (isArray) {
      return `const ${localVar} = mob.findElements(${JSON.stringify(`${strategy}:${locator}`)});`;
    } else {
      return `const ${localVar} = mob.findElement(${JSON.stringify(`${strategy}:${locator}`)});`;
    }
  }

  codeFor_click (varName, varIndex) {
    return `${this.type}.click(${this.getVarName(varName, varIndex)});`;
  }

  codeFor_clear (varName, varIndex) {
    return `${this.type}.clear(${this.getVarName(varName, varIndex)});`;
  }

  codeFor_sendKeys (varName, varIndex, text) {
    return `${this.type}.type(${this.getVarName(varName, varIndex)}, ${JSON.stringify(text)});`;
  }

  codeFor_tap (varNameIgnore, varIndexIgnore, pointerActions) {
    const {x, y} = this.getTapCoordinatesFromPointerActions(pointerActions);
    return `${this.type}.tap(${x}, ${y});`;
  }

  codeFor_swipe (varNameIgnore, varIndexIgnore, pointerActions) {
    const {x1, y1, x2, y2} = this.getSwipeCoordinatesFromPointerActions(pointerActions);
    return `${this.type}.swipeScreen(${x1}, ${y1}, ${x2}, ${y2});`;
  }

  // Execute Script

  codeFor_executeScriptNoArgs (scriptCmd) {
    return `${this.type}.getDriver().executeScript(${JSON.stringify(scriptCmd)});`;
  }

  codeFor_executeScriptWithArgs (scriptCmd, jsonArg) {
    return `${this.type}.getDriver().executeScript(${JSON.stringify(scriptCmd)}, ${JSON.stringify(jsonArg)});`;
  }

  // App Management

  codeFor_getCurrentActivity () {
    return `let activityName = ${this.codeFor_executeScriptNoArgs('mobile: getCurrentActivity')}`;
  }

  codeFor_getCurrentPackage () {
    return `let packageName = ${this.codeFor_executeScriptNoArgs('mobile: getCurrentPackage')}`;
  }

  codeFor_installApp (varNameIgnore, varIndexIgnore, app) {
    return `${this.type}.installApp("${app}");`;
  }

  codeFor_isAppInstalled (varNameIgnore, varIndexIgnore, app) {
    return `let isAppInstalled = ${this.type}.isAppInstalled("${app}");`;
  }

  codeFor_activateApp (varNameIgnore, varIndexIgnore, app) {
    return `${this.type}.getDriver().activateApp("${app}");`;
  }

  codeFor_terminateApp (varNameIgnore, varIndexIgnore, app) {
    return `${this.type}.getDriver().terminateApp("${app}");`;
  }

  codeFor_removeApp (varNameIgnore, varIndexIgnore, app) {
    return `${this.type}.removeApp("${app}")`;
  }

  codeFor_getStrings (varNameIgnore, varIndexIgnore, language, stringFile) {
    return `let appStrings = ${this.type}.getDriver().getStrings(${language ? `"${language}", ` : ''}${stringFile ? `"${stringFile}"` : ''});`;
  }

  // Clipboard

  codeFor_getClipboard () {
    return `let clipboardText = ${this.type}.getDriver().getClipboard();`;
  }

  codeFor_setClipboard (varNameIgnore, varIndexIgnore, clipboardText) {
    return `${this.type}.getDriver().setClipboard("${clipboardText}")`;
  }

  // File Transfer

  codeFor_pushFile (varNameIgnore, varIndexIgnore, pathToInstallTo, fileContentString) {
    return `${this.type}.getDriver().pushFile("${pathToInstallTo}", "${fileContentString}");`;
  }

  codeFor_pullFile (varNameIgnore, varIndexIgnore, pathToPullFrom) {
    return `let fileBase64 = ${this.type}.getDriver().pullFile("${pathToPullFrom}");`;
  }

  codeFor_pullFolder (varNameIgnore, varIndexIgnore, folderToPullFrom) {
    return `let fileBase64 = ${this.type}.getDriver().pullFolder("${folderToPullFrom}");`;
  }

  // Device Interaction

  codeFor_isLocked () {
    return `let isLocked = ${this.codeFor_executeScriptNoArgs('mobile: isLocked')}`;
  }

  codeFor_rotateDevice (varNameIgnore, varIndexIgnore, x, y, radius, rotation, touchCount, duration) {
    return `${this.type}.getDriver().rotateDevice({x: ${x}, y: ${y}, duration: ${duration}, radius: ${radius}, rotation: ${rotation}, touchCount: ${touchCount}});`;
  }

  codeFor_touchId (varNameIgnore, varIndexIgnore, match) {
    return `${this.type}.getDriver().touchId(${match});`;
  }

  codeFor_toggleEnrollTouchId (varNameIgnore, varIndexIgnore, enroll) {
    return `${this.type}.getDriver().toggleEnrollTouchId(${enroll});`;
  }

  // Keyboard

  codeFor_isKeyboardShown () {
    return `let isKeyboardShown = ${this.type}.getDriver().isKeyboardShown();`;
  }

  // Connectivity

  codeFor_toggleAirplaneMode () {
    return `${this.type}.getDriver().toggleAirplaneMode();`;
  }

  codeFor_toggleData () {
    return `${this.type}.getDriver().toggleData();`;
  }

  codeFor_toggleWiFi () {
    return `${this.type}.getDriver().toggleWiFi();`;
  }

  codeFor_sendSMS (varNameIgnore, varIndexIgnore, phoneNumber, text) {
    return `${this.type}.getDriver().sendSms("${phoneNumber}", "${text}");`;
  }

  codeFor_gsmCall (varNameIgnore, varIndexIgnore, phoneNumber, action) {
    return `${this.type}.getDriver().gsmCall("${phoneNumber}", "${action}");`;
  }

  codeFor_gsmSignal (varNameIgnore, varIndexIgnore, signalStrength) {
    return `${this.type}.getDriver().gsmSignal("${signalStrength}");`;
  }

  codeFor_gsmVoice (varNameIgnore, varIndexIgnore, state) {
    return `${this.type}.getDriver().gsmVoice("${state}");`;
  }

  // Session

  codeFor_getSession () {
    return `let caps = ${this.type}.getDriver().getSession();`;
  }

  codeFor_setTimeouts (/*varNameIgnore, varIndexIgnore, timeoutsJson*/) {
    return '/* TODO implement setTimeouts */';
  }

  codeFor_getOrientation () {
    return `let orientation = ${this.type}.getDriver().getOrientation();`;
  }

  codeFor_setOrientation (varNameIgnore, varIndexIgnore, orientation) {
    return `${this.type}.getDriver().setOrientation("${orientation}");`;
  }

  codeFor_getGeoLocation () {
    return `let location = ${this.type}.getDriver().getGeoLocation();`;
  }

  codeFor_setGeoLocation (varNameIgnore, varIndexIgnore, latitude, longitude, altitude) {
    return `${this.type}.getDriver().setGeoLocation({latitude: ${latitude}, longitude: ${longitude}, altitude: ${altitude}});`;
  }

  codeFor_getLogTypes () {
    return `let getLogTypes = ${this.type}.getDriver().getLogTypes();`;
  }

  codeFor_getLogs (varNameIgnore, varIndexIgnore, logType) {
    return `let logs = ${this.type}.getDriver().getLogs("${logType}");`;
  }

  codeFor_updateSettings (varNameIgnore, varIndexIgnore, settingsJson) {
    return `${this.type}.getDriver().updateSettings(${JSON.stringify(settingsJson)});`;
  }

  codeFor_getSettings () {
    return `let settings = ${this.type}.getDriver().getSettings();`;
  }

  // Web

  codeFor_navigateTo (varNameIgnore, varIndexIgnore, url) {
    return `${this.type}.open("${url}");`;
  }

  codeFor_getUrl () {
    return `${this.type}.getUrl();`;
  }

  codeFor_back () {
    return `${this.type}.back();`;
  }

  codeFor_forward () {
    return `${this.type}.getDriver().forward();`;
  }

  codeFor_refresh () {
    return `${this.type}.getDriver().refresh();`;
  }

  // Context

  codeFor_getContext () {
    return `let context = ${this.type}.getDriver().getContext();`;
  }

  codeFor_getContexts () {
    return `let contexts = ${this.type}.getDriver().getContexts();`;
  }

  codeFor_switchContext (varNameIgnore, varIndexIgnore, name) {
    return `${this.type}.setContext("${name}");`;
  }
}

JsOxygenFramework.readableName = 'JS - Oxygen HQ';

export default JsOxygenFramework;
