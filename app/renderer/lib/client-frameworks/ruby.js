import Framework from './framework';
import _ from 'lodash';

class RubyFramework extends Framework {

  get language () {
    return 'ruby';
  }

  // Use this instead of JSON.stringify, as it puts quotes around dictionary keys
  getRubyVal (jsonVal) {
    if (Array.isArray(jsonVal)) {
      const convertedItems = jsonVal.map((item) => this.getRubyVal(item));
      return `[${convertedItems.join(', ')}]`;
    } else if (typeof jsonVal === 'object') {
      const convertedItems = _.map(jsonVal, (v, k) =>
        `${k}: ${this.getRubyVal(v)}`
      );
      return `{${convertedItems.join(', ')}}`;
    }
    return JSON.stringify(jsonVal);
  }

  wrapWithBoilerplate (code) {
    const capStr = _.map(this.caps, (v, k) => `caps[${JSON.stringify(k)}] = ${this.getRubyVal(v)}`).join('\n');
    return `# This sample code supports Appium Ruby lib core client >=5
# gem install appium_lib_core
# Then you can paste this into a file and simply run with Ruby

require 'appium_lib_core'

caps = {}
${capStr}

appium_lib_opts = {
  server_url: "${this.serverUrl}"
}
driver = Appium::Core.for({caps: caps, appium_lib: appium_lib_opts}).start_driver

${code}
driver.quit`;
  }

  addComment(comment) {
    return `# ${comment}`;
  }

  codeFor_findAndAssign (strategy, locator, localVar, isArray) {
    let suffixMap = {
      'xpath': ':xpath',
      'accessibility id': ':accessibility_id',
      'id': ':id',
      'name': ':name',
      'class name': ':class_name',
      '-android uiautomator': ':uiautomator',
      '-android datamatcher': ':datamatcher',
      '-android viewtag': ':viewtag',
      '-ios predicate string': ':predicate',
      '-ios class chain': ':class_chain',
    };
    if (!suffixMap[strategy]) {
      return this.handleUnsupportedLocatorStrategy(strategy, locator);
    }
    if (isArray) {
      return `${localVar} = driver.find_elements ${suffixMap[strategy]}, ${JSON.stringify(locator)}`;
    } else {
      return `${localVar} = driver.find_element ${suffixMap[strategy]}, ${JSON.stringify(locator)}`;
    }
  }

  codeFor_click (varName, varIndex) {
    return `${this.getVarName(varName, varIndex)}.click`;
  }

  codeFor_clear (varName, varIndex) {
    return `${this.getVarName(varName, varIndex)}.clear`;
  }

  codeFor_sendKeys (varName, varIndex, text) {
    return `${this.getVarName(varName, varIndex)}.send_keys ${JSON.stringify(text)}`;
  }

  codeFor_tap (varNameIgnore, varIndexIgnore, pointerActions) {
    const {x, y} = this.getTapCoordinatesFromPointerActions(pointerActions);
    return `driver
  .action
  .move_to_location(${x}, ${y})
  .pointer_down(:left)
  .release
  .perform
`;
  }

  codeFor_swipe (varNameIgnore, varIndexIgnore, pointerActions) {
    const {x1, y1, x2, y2} = this.getSwipeCoordinatesFromPointerActions(pointerActions);
    return `driver
  .action
  .move_to_location(${x1}, ${y1})
  .pointer_down(:left)
  .move_to_location(${x2}, ${y2})
  .release
  .perform
`;
  }

  // Execute Script

  codeFor_executeScriptNoArgs (scriptCmd) {
    return `driver.execute_script '${scriptCmd}'`;
  }

  codeFor_executeScriptWithArgs (scriptCmd, jsonArg) {
    return `driver.execute_script '${scriptCmd}', ${this.getRubyVal(jsonArg[0])}`;
  }

  // App Management

  codeFor_getCurrentActivity () {
    return `activity_name = ${this.codeFor_executeScriptNoArgs('mobile: getCurrentActivity')}`;
  }

  codeFor_getCurrentPackage () {
    return `package_name = ${this.codeFor_executeScriptNoArgs('mobile: getCurrentPackage')}`;
  }

  codeFor_installApp (varNameIgnore, varIndexIgnore, app) {
    return `driver.install_app '${app}'`;
  }

  codeFor_isAppInstalled (varNameIgnore, varIndexIgnore, app) {
    return `is_app_installed = driver.app_installed? '${app}'`;
  }

  codeFor_background (varNameIgnore, varIndexIgnore, seconds) {
    return this.codeFor_executeScriptWithArgs('mobile: backgroundApp', [{seconds}]);
  }

  codeFor_activateApp (varNameIgnore, varIndexIgnore, app) {
    return `driver.activate_app '${app}'`;
  }

  codeFor_terminateApp (varNameIgnore, varIndexIgnore, app) {
    return `driver.terminate_app '${app}'`;
  }

  codeFor_removeApp (varNameIgnore, varIndexIgnore, app) {
    return `driver.remove_app '${app}'`;
  }

  codeFor_getStrings (varNameIgnore, varIndexIgnore, language) {
    if (language === undefined) {
      return `app_strings = ${this.codeFor_executeScriptNoArgs('mobile: getAppStrings')}`;
    } else {
      return `app_strings = ${this.codeFor_executeScriptWithArgs('mobile: getAppStrings', [{language}])}`;
    }
  }

  // Clipboard

  codeFor_getClipboard () {
    return `clipboard_text = driver.get_clipboard`;
  }

  codeFor_setClipboard (varNameIgnore, varIndexIgnore, clipboardText) {
    return `driver.set_clipboard content: '${clipboardText}'`;
  }

  // File Transfer

  codeFor_pushFile (varNameIgnore, varIndexIgnore, pathToInstallTo, fileContentString) {
    return `driver.push_file '${pathToInstallTo}', '${fileContentString}'`;
  }

  codeFor_pullFile (varNameIgnore, varIndexIgnore, pathToPullFrom) {
    return `driver.pull_file '${pathToPullFrom}'`;
  }

  codeFor_pullFolder (varNameIgnore, varIndexIgnore, folderToPullFrom) {
    return `driver.pull_folder '${folderToPullFrom}'`;
  }

  // Device Interaction

  codeFor_shake () {
    return this.codeFor_executeScriptNoArgs('mobile: shake');
  }

  codeFor_lock (varNameIgnore, varIndexIgnore, seconds) {
    return this.codeFor_executeScriptWithArgs('mobile: lock', [{seconds}]);
  }

  codeFor_unlock () {
    // TODO: UiAutomator2 requires arguments, XCUITest does not
    return this.codeFor_executeScriptNoArgs('mobile: unlock');
  }

  codeFor_isLocked () {
    return `is_locked = ${this.codeFor_executeScriptNoArgs('mobile: isLocked')}`;
  }

  codeFor_rotateDevice () {
    return `# Not supported: rotateDevice`;
  }

  codeFor_fingerprint (varNameIgnore, varIndexIgnore, fingerprintId) {
    return this.codeFor_executeScriptWithArgs('mobile: fingerprint', [{fingerprintId}]);
  }

  codeFor_touchId (varNameIgnore, varIndexIgnore, match) {
    return `driver.touch_id ${match}`;
  }

  codeFor_toggleEnrollTouchId (varNameIgnore, varIndexIgnore, enroll) {
    return `driver.toggle_touch_id_enrollment ${enroll}`;
  }

  // Keyboard

  codeFor_pressKeyCode (varNameIgnore, varIndexIgnore, keycode, metastate, flags) {
    return this.codeFor_executeScriptWithArgs('mobile: pressKey', [{keycode, metastate, flags}]);
  }

  codeFor_longPressKeyCode (varNameIgnore, varIndexIgnore, keycode, metastate, flags) {
    return this.codeFor_executeScriptWithArgs('mobile: pressKey', [{keycode, metastate, flags, isLongPress: true}]);
  }

  codeFor_hideKeyboard () {
    return this.codeFor_executeScriptNoArgs('mobile: hideKeyboard');
  }

  codeFor_isKeyboardShown () {
    return `is_keyboard_shown = ${this.codeFor_executeScriptNoArgs('mobile: isKeyboardShown')}`;
  }

  // Connectivity

  // TODO: use mobile: setConnectivity after adding it in GUI

  codeFor_toggleAirplaneMode () {
    return `driver.toggle_airplane_mode`;
  }

  codeFor_toggleData () {
    return `driver.toggle_data`;
  }

  codeFor_toggleWiFi () {
    return `driver.toggle_wifi`;
  }

  codeFor_toggleLocationServices () {
    return this.codeFor_executeScriptNoArgs('mobile: toggleGps');
  }

  codeFor_sendSMS (varNameIgnore, varIndexIgnore, phoneNumber, text) {
    return `driver.send_sms phone_number: '${phoneNumber}', message: '${text}'`;
  }

  codeFor_gsmCall (varNameIgnore, varIndexIgnore, phoneNumber, action) {
    return `driver.gsm_call phone_number: '${phoneNumber}', action: :${action}`;
  }

  codeFor_gsmSignal (varNameIgnore, varIndexIgnore, signalStrength) {
    return `driver.gsm_signal :${signalStrength}`;
  }

  codeFor_gsmVoice (varNameIgnore, varIndexIgnore, state) {
    return `driver.gsm_voice :${state}`;
  }

  // Performance Data

  codeFor_getPerformanceData (varNameIgnore, varIndexIgnore, packageName, dataType) {
    return this.codeFor_executeScriptWithArgs('mobile: getPerformanceData', [{packageName, dataType}]);
  }

  codeFor_getPerformanceDataTypes () {
    return this.codeFor_executeScriptNoArgs('mobile: getPerformanceDataTypes');
  }

  // System

  codeFor_openNotifications () {
    return this.codeFor_executeScriptNoArgs('mobile: openNotifications');
  }

  codeFor_getDeviceTime () {
    return this.codeFor_executeScriptNoArgs('mobile: getDeviceTime');
  }

  // Session

  codeFor_getSession () {
    return `session_capabilities = driver.session_capabilities`;
  }

  codeFor_setTimeouts (/*varNameIgnore, varIndexIgnore, timeoutsJson*/) {
    return '# TODO implement setTimeouts';
  }

  codeFor_getOrientation () {
    return `orientation = driver.orientation`;
  }

  codeFor_setOrientation (varNameIgnore, varIndexIgnore, orientation) {
    return `driver.rotation = :${_.lowerCase(orientation)}`;
  }

  codeFor_getGeoLocation () {
    return `location = driver.location`;
  }

  codeFor_setGeoLocation (varNameIgnore, varIndexIgnore, latitude, longitude, altitude) {
    return `driver.set_location ${latitude}, ${longitude}, ${altitude}`;
  }

  codeFor_getLogTypes () {
    return `log_types = driver.logs.available_types`;
  }

  codeFor_getLogs (varNameIgnore, varIndexIgnore, logType) {
    return `logs = driver.logs.get :${_.lowerCase(logType)}`;
  }

  codeFor_updateSettings (varNameIgnore, varIndexIgnore, settingsJson) {
    return `driver.update_settings ${this.getRubyVal(settingsJson)}`;
  }

  codeFor_getSettings () {
    return `settings = driver.get_settings`;
  }

  // Web

  codeFor_navigateTo (varNameIgnore, varIndexIgnore, url) {
    return `driver.get '${url}'`;
  }

  codeFor_getUrl () {
    return `current_url = driver.get_current_url`;
  }

  codeFor_back () {
    return `driver.back`;
  }

  codeFor_forward () {
    return `driver.forward`;
  }

  codeFor_refresh () {
    return `driver.refresh`;
  }

  // Context

  codeFor_getContext () {
    return `context = driver.current_context`;
  }

  codeFor_getContexts () {
    return `contexts = driver.available_contexts`;
  }

  codeFor_switchContext (varNameIgnore, varIndexIgnore, name) {
    return `driver.set_context '${name}'`;
  }
}

RubyFramework.readableName = 'Ruby';

export default RubyFramework;
