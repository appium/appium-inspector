/* eslint no-useless-escape: 0 */

import Framework from './framework';

class RobotFramework extends Framework {

  get language () {
    //TODO: Make https://highlightjs.org/ use robot syntax
    return 'python';
  }

  get getCapsVariables () {
    return Object.keys(this.caps).map((k) => `\$\{${k}\}    ${this.getPythonVal(this.caps[k])}`).join('\n');
  }

  getPythonVal (jsonVal) {
    if (typeof jsonVal === 'boolean') {
      return jsonVal ? 'true' : 'false';
    }
    return jsonVal;
  }

  wrapWithBoilerplate (code) {
    return `# This sample code uses the Appium robot client
# pip install robotframework-appiumlibrary
# Then you can paste this into a file and simply run with robot
#
#  more keywords on: http://serhatbolsu.github.io/robotframework-appiumlibrary/AppiumLibrary.html
#
# if your tests fails saying 'did not match any elements' consider use 'wait activity' or
# 'wait until page contains element' before a click command

*** Settings ***
Library           AppiumLibrary
Test Teardown     Quit Application
Suite Teardown    Close Application

*** Variables ***
$\{REMOTE_URL\}   ${this.serverUrl}
${this.getCapsVariables}

*** Test Cases ***
Test case name
${this.indent(this.getApplicationInitialization(), 4)}
${this.indent(code, 4)}
`;
  }

  addComment(comment) {
    return `# ${comment}`;
  }

  codeFor_findAndAssign (strategy, locator/*, localVar, isArray*/) {
    let suffixMap = {
      xpath: 'xpath',
      'accessibility id': 'accessibility_id',
      'id': 'id',
      'name': 'name', // TODO: How does Python use name selector
      'class name': 'class_name',
      '-android uiautomator': 'unsupported',
      '-android datamatcher': 'unsupported',
      '-android viewtag': 'unsupported',
      '-ios predicate string': 'ios_predicate',
      '-ios class chain': 'ios_uiautomation', // TODO: Could not find iOS UIAutomation
    };
    if (!suffixMap[strategy]) {
      return this.handleUnsupportedLocatorStrategy(strategy, locator);
    }
    //TODO: in the robot case, we need the ID on the codeFor_ for execution
    this.lastID = `${strategy}=${locator}`;

    if (this.lastID.includes('accessibility id')) {
      this.lastID = this.lastID.replace('accessibility id', 'accessibility_id');
    }

    return `# ${this.lastID}`;
  }

  getApplicationInitialization () {
    let varString = Object.keys(this.caps).map((k) => `${k}=\$\{${k}\}`).join('  ');
    return `    Open Application    \$\{REMOTE_URL\}   ${varString}`;
  }

  codeFor_executeScript (/*varNameIgnore, varIndexIgnore, args*/) {
    return `    Execute Script    TODO implement executeScript`;
  }


  codeFor_click (/*varName, varIndex*/) {
    return `    Click Element    ${this.lastID}`;
  }

  codeFor_clear (/*varName, varIndex*/) {
    return `    Clear Text    ${this.lastID}`;
  }

  codeFor_sendKeys (varName, varIndex, text) {
    return `    Input Text    ${this.lastID}    ${text}`;
  }

  codeFor_back () {
    return `    Go Back`;
  }

  codeFor_tap (varNameIgnore, varIndexIgnore, pointerActions) {
    const {x, y} = this.getTapCoordinatesFromPointerActions(pointerActions);

    return `    Tap With Positions    100    \$\{${x}, ${y}\}`;
  }

  codeFor_swipe (varNameIgnore, varIndexIgnore, pointerActions) {
    const {x1, y1, x2, y2} = this.getSwipeCoordinatesFromPointerActions(pointerActions);

    return `    Swipe    ${x1}    ${y1}    ${x2}    ${y2}`;
  }

  // TODO: Add these robot framework commands
  codeFor_getCurrentActivity () {
    return '';
  }

  codeFor_getCurrentPackage () {
    return '';
  }

  codeFor_installApp () {
    return ``;
  }

  codeFor_isAppInstalled () {
    return ``;
  }

  codeFor_background () {
    return ``;
  }

  codeFor_removeApp () {
    return ``;
  }

  codeFor_getStrings () {
    return ``;
  }

  codeFor_getClipboard () {
    return ``;
  }

  codeFor_setClipboard () {
    return ``;
  }

  codeFor_pressKeyCode () {
    return ``;
  }

  codeFor_longPressKeyCode () {
    return ``;
  }

  codeFor_hideKeyboard () {
    return ``;
  }

  codeFor_isKeyboardShown () {
    return ``;
  }

  codeFor_pushFile () {
    return ``;
  }

  codeFor_pullFile () {
    return ``;
  }

  codeFor_pullFolder () {
    return ``;
  }

  codeFor_toggleAirplaneMode () {
    return ``;
  }

  codeFor_toggleData () {
    return ``;
  }

  codeFor_toggleWiFi () {
    return ``;
  }

  codeFor_toggleLocationServices () {
    return ``;
  }

  codeFor_sendSMS () {
    return ``;
  }

  codeFor_gsmCall () {
    return ``;
  }

  codeFor_gsmSignal () {
    return ``;
  }

  codeFor_gsmVoice () {
    return ``;
  }

  codeFor_shake () {
    return ``;
  }

  codeFor_lock () {
    return ``;
  }

  codeFor_unlock () {
    return ``;
  }

  codeFor_isLocked () {
    return ``;
  }

  codeFor_rotateDevice () {
    return ``;
  }

  codeFor_getPerformanceData () {
    return ``;
  }

  codeFor_getPerformanceDataTypes () {
    return ``;
  }

  codeFor_touchId () {
    return ``;
  }

  codeFor_toggleEnrollTouchId () {
    return ``;
  }

  codeFor_openNotifications () {
    return ``;
  }

  codeFor_getDeviceTime () {
    return ``;
  }

  codeFor_fingerprint () {
    return ``;
  }

  codeFor_getSession () {
    return ``;
  }

  codeFor_setTimeouts () {
    return ``;
  }

  codeFor_getOrientation () {
    return ``;
  }

  codeFor_setOrientation () {
    return ``;
  }

  codeFor_getGeoLocation () {
    return ``;
  }

  codeFor_setGeoLocation () {
    return ``;
  }

  codeFor_getLogTypes () {
    return ``;
  }

  codeFor_getLogs () {
    return ``;
  }

  codeFor_updateSettings () {
    return ``;
  }

  codeFor_getSettings () {
    return ``;
  }

  // Web

  codeFor_navigateTo () {
    return ``;
  }

  codeFor_getUrl () {
    return ``;
  }

  codeFor_forward () {
    return ``;
  }

  codeFor_refresh () {
    return ``;
  }

  // Context

  codeFor_getContext () {
    return ``;
  }

  codeFor_getContexts () {
    return ``;
  }

  codeFor_switchContext () {
    return ``;
  }
}

RobotFramework.readableName = 'Robot Framework';

export default RobotFramework;
