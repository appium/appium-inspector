import _ from 'lodash';

import CommonClientFramework from './common.js';

export default class RobotFramework extends CommonClientFramework {
  static readableName = 'Robot Framework';
  static highlightLang = 'python'; // Robot highlighting requires highlightjs-robot package

  getRobotVal(jsonVal) {
    if (typeof jsonVal === 'boolean') {
      return jsonVal ? '${True}' : '${False}';
    } else if (typeof jsonVal === 'number') {
      return `$\{${jsonVal}}`;
    }
    return jsonVal;
  }

  wrapWithBoilerplate(code) {
    const capsParams = _.map(this.caps, (v, k) => `${k}=${this.getRobotVal(v)}`);
    return `# This sample code supports Appium Robot client >=2
# pip install robotframework-appiumlibrary
# Then you can paste this into a file and simply run with Robot
#
# Find keywords at: http://serhatbolsu.github.io/robotframework-appiumlibrary/AppiumLibrary.html
#
# If your tests fails saying 'did not match any elements' consider using 'wait activity' or
# 'wait until page contains element' before a click command

*** Settings ***
Library           AppiumLibrary
Test Teardown     Close Application

*** Test Cases ***
Test Case Name
    Open Application    ${this.serverUrl}    ${capsParams.join('    ')}
${this.indent(code, 4)}
`;
  }

  addComment(comment) {
    return `# ${comment}`;
  }

  codeFor_findAndAssign(strategy, locator, localVar /*, isArray*/) {
    let suffixMap = {
      xpath: 'xpath',
      'accessibility id': 'accessibility_id',
      id: 'id',
      'class name': 'class',
      name: 'name',
      '-android uiautomator': 'android',
      // '-android datamatcher': 'unsupported',
      // '-android viewtag': 'unsupported',
      '-ios predicate string': 'nsp',
      '-ios class chain': 'chain',
    };
    if (!suffixMap[strategy]) {
      return this.handleUnsupportedLocatorStrategy(strategy, locator);
    }

    return `$\{${localVar}} =    Set Variable     ${suffixMap[strategy]}=${locator}`;
  }

  codeFor_elementClick(varName, varIndex) {
    return `Click Element    $\{${this.getVarName(varName, varIndex)}}`;
  }

  codeFor_elementClear(varName, varIndex) {
    return `Clear Text    $\{${this.getVarName(varName, varIndex)}}`;
  }

  codeFor_elementSendKeys(varName, varIndex, text) {
    return `Input Text    $\{${this.getVarName(varName, varIndex)}}    ${text}`;
  }

  codeFor_tap(varNameIgnore, varIndexIgnore, pointerActions) {
    const {x, y} = this.getTapCoordinatesFromPointerActions(pointerActions);
    return `@{finger} =    Create List    $\{${x}}    $\{${y}}
@{positions} =    Create List    $\{finger}
Tap With Positions    $\{100}    $\{positions}`;
  }

  codeFor_swipe(varNameIgnore, varIndexIgnore, pointerActions) {
    const {x1, y1, x2, y2} = this.getSwipeCoordinatesFromPointerActions(pointerActions);
    return `Swipe    $\{${x1}}    $\{${y1}}    $\{${x2}}    $\{${y2}}`;
  }

  // Top-Level Commands

  codeFor_executeScriptNoArgs(scriptCmd) {
    return `Execute Script    ${scriptCmd}`;
  }

  codeFor_executeScriptWithArgs(scriptCmd, jsonArg, varAssignment = '') {
    // change the JSON object into a format accepted by Create Dictionary: a sequence of key=value
    const cleanedJson = _.omitBy(jsonArg[0], _.isUndefined);
    const argsValuesStrings = _.map(cleanedJson, (v, k) => `${k}=${this.getRobotVal(v)}`);
    return `&{scriptArgument}    Create Dictionary    ${argsValuesStrings.join('    ')}
${varAssignment}Execute Script    ${scriptCmd}    $\{scriptArgument}`;
  }

  codeFor_updateSettings() {
    return '# Not supported: updateSettings';
  }

  codeFor_getSettings() {
    return '# Not supported: getSettings';
  }

  // Session

  codeFor_status() {
    return '# Not supported: status';
  }

  codeFor_getSession() {
    return '# Not supported: getSession';
  }

  codeFor_getAppiumCommands() {
    return `# Not supported: getAppiumCommands`;
  }

  codeFor_getAppiumExtensions() {
    return `# Not supported: getAppiumExtensions`;
  }

  codeFor_getAppiumSessionCapabilities() {
    return `# Not supported: getAppiumSessionCapabilities`;
  }

  codeFor_getTimeouts() {
    return '# Not supported: getTimeouts';
  }

  codeFor_setTimeouts() {
    // There is 'Set Appium Timeout' which may be different
    return '# Not supported: setTimeouts';
  }

  codeFor_getLogTypes() {
    return '# Not supported: getLogTypes';
  }

  codeFor_getLogs() {
    return '# Not supported: getLogs';
  }

  // Context

  codeFor_getAppiumContext() {
    return '${context} =    Get Current Context';
  }

  codeFor_getAppiumContexts() {
    return '${contexts} =    Get Contexts';
  }

  codeFor_switchAppiumContext(varNameIgnore, varIndexIgnore, name) {
    return `Switch To Context    ${name}`;
  }

  // Device Interaction

  codeFor_getWindowRect() {
    return `# Not supported: getWindowRect`;
  }

  codeFor_takeScreenshot() {
    return `Capture Page Screenshot`;
  }

  codeFor_isKeyboardShown() {
    return `$\{is_keyboard_shown} =    ${this.codeFor_executeScriptNoArgs(
      'mobile: isKeyboardShown',
    )}`;
  }

  codeFor_getOrientation() {
    return '# Not supported: getOrientation';
  }

  codeFor_setOrientation(varNameIgnore, varIndexIgnore, orientation) {
    if (orientation === 'LANDSCAPE') {
      return 'Landscape';
    } else if (orientation === 'PORTRAIT') {
      return 'Portrait';
    }
  }

  codeFor_getGeoLocation() {
    return '# Not supported: getGeoLocation';
  }

  codeFor_setGeoLocation(varNameIgnore, varIndexIgnore, latitude, longitude, altitude) {
    return `Set Location    $\{${latitude}}    $\{${longitude}}    $\{${altitude}}`;
  }

  codeFor_rotateDevice() {
    return '# Not supported: rotateDevice';
  }

  // App Management

  codeFor_installApp(varNameIgnore, varIndexIgnore, app) {
    return `Install App    ${app}`;
  }

  codeFor_isAppInstalled() {
    return '# Not supported: isAppInstalled';
  }

  codeFor_activateApp(varNameIgnore, varIndexIgnore, app) {
    return `Activate Application    ${app}`;
  }

  codeFor_terminateApp(varNameIgnore, varIndexIgnore, app) {
    return `Terminate Application    ${app}`;
  }

  codeFor_removeApp(varNameIgnore, varIndexIgnore, app) {
    return `Remove Application    ${app}`;
  }

  codeFor_queryAppState() {
    return `# Not supported: queryAppState`;
  }

  // File Transfer

  codeFor_pushFile(varNameIgnore, varIndexIgnore, pathToInstallTo, fileContentString) {
    return `Push File    ${pathToInstallTo}    ${fileContentString}`;
  }

  codeFor_pullFile(varNameIgnore, varIndexIgnore, pathToPullFrom) {
    return `$\{file_base64} =    Pull File    ${pathToPullFrom}`;
  }

  codeFor_pullFolder(varNameIgnore, varIndexIgnore, folderToPullFrom) {
    return `$\{folder_base64} =    Pull Folder    ${folderToPullFrom}`;
  }

  // Web

  codeFor_navigateTo(varNameIgnore, varIndexIgnore, url) {
    return `Go To Url    ${url}`;
  }

  codeFor_getUrl() {
    return '${current_url} =    Get Window Url';
  }

  codeFor_back() {
    return `Go Back`;
  }

  codeFor_forward() {
    return '# Not supported: forward';
  }

  codeFor_refresh() {
    return '# Not supported: refresh';
  }

  codeFor_getTitle() {
    return '${title} =    Get Window Title';
  }

  codeFor_getWindowHandle() {
    return '# Not supported: getWindowHandle';
  }

  codeFor_closeWindow() {
    return `# Not supported: closeWindow`;
  }

  codeFor_switchToWindow(varNameIgnore, varIndexIgnore, handle) {
    return `Switch To Window    ${handle}`;
  }

  codeFor_getWindowHandles() {
    return '${window_handles} =    Get Windows';
  }

  codeFor_createWindow() {
    return '# Not supported: createWindow';
  }
}
