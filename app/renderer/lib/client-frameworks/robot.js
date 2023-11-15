import _ from 'lodash';

import Framework from './framework';

class RobotFramework extends Framework {
  get language() {
    // Robot highlighting requires highlightjs-robot package
    return 'python';
  }

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

  codeFor_click(varName, varIndex) {
    return `Click Element    $\{${this.getVarName(varName, varIndex)}}`;
  }

  codeFor_clear(varName, varIndex) {
    return `Clear Text    $\{${this.getVarName(varName, varIndex)}}`;
  }

  codeFor_sendKeys(varName, varIndex, text) {
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

  // Execute Script

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

  // App Management

  codeFor_getCurrentActivity() {
    return `$\{activity_name} =    ${this.codeFor_executeScriptNoArgs(
      'mobile: getCurrentActivity',
    )}`;
  }

  codeFor_getCurrentPackage() {
    return `$\{package_name} =    ${this.codeFor_executeScriptNoArgs('mobile: getCurrentPackage')}`;
  }

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

  codeFor_getStrings(varNameIgnore, varIndexIgnore, language) {
    if (language === undefined) {
      return `$\{app_strings} =    ${this.codeFor_executeScriptNoArgs('mobile: getAppStrings')}`;
    } else {
      return this.codeFor_executeScriptWithArgs(
        'mobile: getAppStrings',
        [{language}],
        `$\{app_strings} =    `,
      );
    }
  }

  // Clipboard

  codeFor_getClipboard() {
    return '# Not supported: getClipboard';
  }

  codeFor_setClipboard() {
    return '# Not supported: setClipboard';
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

  // Device Interaction

  codeFor_isLocked() {
    return `$\{is_locked} =    ${this.codeFor_executeScriptNoArgs('mobile: isLocked')}`;
  }

  codeFor_rotateDevice() {
    return '# Not supported: rotateDevice';
  }

  codeFor_touchId(varNameIgnore, varIndexIgnore, match) {
    return `Touch Id    $\{${match}}`;
  }

  codeFor_toggleEnrollTouchId() {
    return 'Toggle Touch Id Enrollment';
  }

  // Keyboard

  codeFor_isKeyboardShown() {
    return `$\{is_keyboard_shown} =    ${this.codeFor_executeScriptNoArgs(
      'mobile: isKeyboardShown',
    )}`;
  }

  // Connectivity

  codeFor_toggleAirplaneMode() {
    return '# Not supported: toggleAirplaneMode';
  }

  codeFor_toggleData() {
    return '# Not supported: toggleData';
  }

  codeFor_toggleWiFi() {
    return '# Not supported: toggleWifi';
  }

  codeFor_sendSMS() {
    return '# Not supported: sendSMS';
  }

  codeFor_gsmCall() {
    return '# Not supported: gsmCall';
  }

  codeFor_gsmSignal() {
    return '# Not supported: gsmSignal';
  }

  codeFor_gsmVoice() {
    return '# Not supported: gsmVoice';
  }

  // Session

  codeFor_getSession() {
    return '# Not supported: getSession';
  }

  codeFor_setTimeouts() {
    // There is 'Set Appium Timeout' which may be different
    return '# Not supported: setTimeouts';
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

  codeFor_getLogTypes() {
    return '# Not supported: getLogTypes';
  }

  codeFor_getLogs() {
    return '# Not supported: getLogs';
  }

  codeFor_updateSettings() {
    return '# Not supported: updateSettings';
  }

  codeFor_getSettings() {
    return '# Not supported: getSettings';
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

  // Context

  codeFor_getContext() {
    return '${context} =    Get Current Context';
  }

  codeFor_getContexts() {
    return '${contexts} =    Get Contexts';
  }

  codeFor_switchContext(varNameIgnore, varIndexIgnore, name) {
    return `Switch To Context    ${name}`;
  }
}

RobotFramework.readableName = 'Robot Framework';

export default RobotFramework;
