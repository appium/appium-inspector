import _ from 'lodash';

import Framework from './framework';

class PythonFramework extends Framework {
  get language() {
    return 'python';
  }

  getPythonVal(jsonVal) {
    if (typeof jsonVal === 'boolean') {
      return jsonVal ? 'True' : 'False';
    } else if (Array.isArray(jsonVal)) {
      const convertedItems = jsonVal.map((item) => this.getPythonVal(item));
      return `[${convertedItems.join(', ')}]`;
    } else if (typeof jsonVal === 'object') {
      const cleanedJson = _.omitBy(jsonVal, _.isUndefined);
      const convertedItems = _.map(
        cleanedJson,
        (v, k) => `${JSON.stringify(k)}: ${this.getPythonVal(v)}`,
      );
      return `{${convertedItems.join(', ')}}`;
    }
    return JSON.stringify(jsonVal);
  }

  wrapWithBoilerplate(code) {
    let optionsStr = _.map(
      this.caps,
      (v, k) => `${JSON.stringify(k)}: ${this.getPythonVal(v)}`,
    ).join(',\n\t');
    optionsStr = `{\n\t${optionsStr}\n}`;
    return `# This sample code supports Appium Python client >=4.0.0
# pip install Appium-Python-Client
# Then you can paste this into a file and simply run with Python

from appium import webdriver
from appium.options.common.base import AppiumOptions
from appium.webdriver.common.appiumby import AppiumBy

# For W3C actions
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.actions import interaction
from selenium.webdriver.common.actions.action_builder import ActionBuilder
from selenium.webdriver.common.actions.pointer_input import PointerInput

options = AppiumOptions()
options.load_capabilities(${optionsStr})

driver = webdriver.Remote("${this.serverUrl}", options=options)

${code}
driver.quit()`;
  }

  addComment(comment) {
    return `# ${comment}`;
  }

  codeFor_findAndAssign(strategy, locator, localVar, isArray) {
    let suffixMap = {
      xpath: 'AppiumBy.XPATH',
      'accessibility id': 'AppiumBy.ACCESSIBILITY_ID',
      id: 'AppiumBy.ID',
      'class name': 'AppiumBy.CLASS_NAME',
      name: 'AppiumBy.NAME',
      '-android uiautomator': 'AppiumBy.ANDROID_UIAUTOMATOR',
      '-android datamatcher': 'AppiumBy.ANDROID_DATA_MATCHER',
      '-android viewtag': 'AppiumBy.ANDROID_VIEWTAG',
      '-ios predicate string': 'AppiumBy.IOS_PREDICATE',
      '-ios class chain': 'AppiumBy.IOS_CLASS_CHAIN',
    };
    if (!suffixMap[strategy]) {
      return this.handleUnsupportedLocatorStrategy(strategy, locator);
    }
    if (isArray) {
      return `${localVar} = driver.find_elements(by=${suffixMap[strategy]}, value=${JSON.stringify(
        locator,
      )})`;
    } else {
      return `${localVar} = driver.find_element(by=${suffixMap[strategy]}, value=${JSON.stringify(
        locator,
      )})`;
    }
  }

  codeFor_click(varName, varIndex) {
    return `${this.getVarName(varName, varIndex)}.click()`;
  }

  codeFor_clear(varName, varIndex) {
    return `${this.getVarName(varName, varIndex)}.clear()`;
  }

  codeFor_sendKeys(varName, varIndex, text) {
    return `${this.getVarName(varName, varIndex)}.send_keys(${JSON.stringify(text)})`;
  }

  codeFor_tap(varNameIgnore, varIndexIgnore, pointerActions) {
    const {x, y} = this.getTapCoordinatesFromPointerActions(pointerActions);
    return `actions = ActionChains(driver)
actions.w3c_actions = ActionBuilder(driver, mouse=PointerInput(interaction.POINTER_TOUCH, "touch"))
actions.w3c_actions.pointer_action.move_to_location(${x}, ${y})
actions.w3c_actions.pointer_action.pointer_down()
actions.w3c_actions.pointer_action.pause(0.1)
actions.w3c_actions.pointer_action.release()
actions.perform()
`;
  }

  codeFor_swipe(varNameIgnore, varIndexIgnore, pointerActions) {
    const {x1, y1, x2, y2} = this.getSwipeCoordinatesFromPointerActions(pointerActions);
    return `actions = ActionChains(driver)
actions.w3c_actions = ActionBuilder(driver, mouse=PointerInput(interaction.POINTER_TOUCH, "touch"))
actions.w3c_actions.pointer_action.move_to_location(${x1}, ${y1})
actions.w3c_actions.pointer_action.pointer_down()
actions.w3c_actions.pointer_action.move_to_location(${x2}, ${y2})
actions.w3c_actions.pointer_action.release()
actions.perform()
`;
  }

  // Execute Script

  codeFor_executeScriptNoArgs(scriptCmd) {
    return `driver.execute_script('${scriptCmd}')`;
  }

  codeFor_executeScriptWithArgs(scriptCmd, jsonArg) {
    return `driver.execute_script('${scriptCmd}', ${this.getPythonVal(jsonArg[0])})`;
  }

  // App Management

  codeFor_getCurrentActivity() {
    return `activity_name = ${this.codeFor_executeScriptNoArgs('mobile: getCurrentActivity')}`;
  }

  codeFor_getCurrentPackage() {
    return `package_name = ${this.codeFor_executeScriptNoArgs('mobile: getCurrentPackage')}`;
  }

  codeFor_installApp(varNameIgnore, varIndexIgnore, app) {
    return `driver.install_app('${app}')`;
  }

  codeFor_isAppInstalled(varNameIgnore, varIndexIgnore, app) {
    return `is_app_installed = driver.is_app_installed('${app}')`;
  }

  codeFor_activateApp(varNameIgnore, varIndexIgnore, app) {
    return `driver.activate_app('${app}')`;
  }

  codeFor_terminateApp(varNameIgnore, varIndexIgnore, app) {
    return `driver.terminate_app('${app}')`;
  }

  codeFor_removeApp(varNameIgnore, varIndexIgnore, app) {
    return `driver.remove_app('${app}')`;
  }

  codeFor_getStrings(varNameIgnore, varIndexIgnore, language, stringFile) {
    return `app_strings = driver.app_strings(${language ? `'${language}'` : 'None'}, ${
      stringFile ? `'${stringFile}'` : 'None'
    })`;
  }

  // Clipboard

  codeFor_getClipboard() {
    return `clipboard_text = driver.get_clipboard_text()`;
  }

  codeFor_setClipboard(varNameIgnore, varIndexIgnore, clipboardText) {
    return `driver.set_clipboard_text('${clipboardText}')`;
  }

  // File Transfer

  codeFor_pushFile(varNameIgnore, varIndexIgnore, pathToInstallTo, fileContentString) {
    return `driver.push_file('${pathToInstallTo}', '${fileContentString}')`;
  }

  codeFor_pullFile(varNameIgnore, varIndexIgnore, pathToPullFrom) {
    return `file_base64 = driver.pull_file('${pathToPullFrom}')`;
  }

  codeFor_pullFolder(varNameIgnore, varIndexIgnore, folderToPullFrom) {
    return `folder_base64 = driver.pull_folder('${folderToPullFrom}')`;
  }

  // Device Interaction

  codeFor_isLocked() {
    return `is_locked = ${this.codeFor_executeScriptNoArgs('mobile: isLocked')}`;
  }

  codeFor_rotateDevice() {
    return `# Not supported: rotate device`;
  }

  codeFor_touchId(varNameIgnore, varIndexIgnore, match) {
    return `driver.touch_id(${match})`;
  }

  codeFor_toggleEnrollTouchId() {
    return `driver.toggle_touch_id_enrollment()`;
  }

  // Keyboard

  codeFor_isKeyboardShown() {
    return `is_keyboard_shown = driver.is_keyboard_shown()`;
  }

  // Connectivity

  codeFor_toggleAirplaneMode() {
    return `# Not supported: toggleAirplaneMode`;
  }

  codeFor_toggleData() {
    return `# Not supported: toggleData`;
  }

  codeFor_toggleWiFi() {
    return `driver.toggle_wifi()`;
  }

  codeFor_sendSMS(varNameIgnore, varIndexIgnore, phoneNumber, text) {
    return `driver.send_sms('${phoneNumber}', '${text}')`;
  }

  codeFor_gsmCall(varNameIgnore, varIndexIgnore, phoneNumber, action) {
    return `driver.make_gsm_call('${phoneNumber}', '${action}')`;
  }

  codeFor_gsmSignal(varNameIgnore, varIndexIgnore, signalStrength) {
    return `driver.set_gsm_signal(${signalStrength})`;
  }

  codeFor_gsmVoice(varNameIgnore, varIndexIgnore, state) {
    return `driver.set_gsm_voice('${state}')`;
  }

  // Session

  codeFor_getSession() {
    return `desired_caps = driver.desired_capabilities()`;
  }

  codeFor_setTimeouts(/*varNameIgnore, varIndexIgnore, timeoutsJson*/) {
    return '# TODO implement setTimeouts';
  }

  codeFor_getOrientation() {
    return `orientation = driver.orientation`;
  }

  codeFor_setOrientation(varNameIgnore, varIndexIgnore, orientation) {
    return `driver.orientation = '${orientation}'`;
  }

  codeFor_getGeoLocation() {
    return `location = driver.location()`;
  }

  codeFor_setGeoLocation(varNameIgnore, varIndexIgnore, latitude, longitude, altitude) {
    return `driver.set_location(${latitude}, ${longitude}, ${altitude})`;
  }

  codeFor_getLogTypes() {
    return `log_types = driver.log_types()`;
  }

  codeFor_getLogs(varNameIgnore, varIndexIgnore, logType) {
    return `logs = driver.get_log('${logType}')`;
  }

  codeFor_updateSettings(varNameIgnore, varIndexIgnore, settingsJson) {
    return `driver.update_settings(${this.getPythonVal(settingsJson)}))`;
  }

  codeFor_getSettings() {
    return `settings = driver.get_settings()`;
  }

  // Web

  codeFor_navigateTo(varNameIgnore, varIndexIgnore, url) {
    return `driver.get('${url}')`;
  }

  codeFor_getUrl() {
    return `current_url = driver.current_url`;
  }

  codeFor_back() {
    return `driver.back()`;
  }

  codeFor_forward() {
    return `driver.forward()`;
  }

  codeFor_refresh() {
    return `driver.refresh()`;
  }

  // Context

  codeFor_getContext() {
    return `context = driver.current_context`;
  }

  codeFor_getContexts() {
    return `contexts = driver.contexts`;
  }

  codeFor_switchContext(varNameIgnore, varIndexIgnore, name) {
    return `driver.switch_to.context('${name}')`;
  }
}

PythonFramework.readableName = 'Python';

export default PythonFramework;
