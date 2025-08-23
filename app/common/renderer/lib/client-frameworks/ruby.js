import _ from 'lodash';

import CommonClientFramework from './common.js';

export default class RubyFramework extends CommonClientFramework {
  static readableName = 'Ruby';
  static highlightLang = 'ruby';

  // Use this instead of JSON.stringify, as it puts quotes around dictionary keys
  getRubyVal(jsonVal) {
    if (Array.isArray(jsonVal)) {
      const convertedItems = jsonVal.map((item) => this.getRubyVal(item));
      return `[${convertedItems.join(', ')}]`;
    } else if (typeof jsonVal === 'object') {
      const cleanedJson = _.omitBy(jsonVal, _.isUndefined);
      const convertedItems = _.map(cleanedJson, (v, k) => `${k}: ${this.getRubyVal(v)}`);
      return `{${convertedItems.join(', ')}}`;
    }
    return JSON.stringify(jsonVal);
  }

  wrapWithBoilerplate(code) {
    const capStr = _.map(
      this.caps,
      (v, k) => `caps[${JSON.stringify(k)}] = ${this.getRubyVal(v)}`,
    ).join('\n');
    return `# This sample code supports Appium Ruby lib core client >=5
# gem install appium_lib_core
# Then you can paste this into a file and simply run with Ruby

require 'appium_lib_core'

caps = {}
${capStr}

core = Appium::Core.for url: "${this.serverUrl}", caps: caps
driver = core.start_driver

${code}
driver.quit`;
  }

  addComment(comment) {
    return `# ${comment}`;
  }

  codeFor_findAndAssign(strategy, locator, localVar, isArray) {
    let suffixMap = {
      xpath: ':xpath',
      'accessibility id': ':accessibility_id',
      id: ':id',
      name: ':name',
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
      return `${localVar} = driver.find_elements ${suffixMap[strategy]}, ${JSON.stringify(
        locator,
      )}`;
    } else {
      return `${localVar} = driver.find_element ${suffixMap[strategy]}, ${JSON.stringify(locator)}`;
    }
  }

  codeFor_elementClick(varName, varIndex) {
    return `${this.getVarName(varName, varIndex)}.click`;
  }

  codeFor_elementClear(varName, varIndex) {
    return `${this.getVarName(varName, varIndex)}.clear`;
  }

  codeFor_elementSendKeys(varName, varIndex, text) {
    return `${this.getVarName(varName, varIndex)}.send_keys ${JSON.stringify(text)}`;
  }

  codeFor_tap(varNameIgnore, varIndexIgnore, pointerActions) {
    const {x, y} = this.getTapCoordinatesFromPointerActions(pointerActions);
    return `driver
  .action
  .move_to_location(${x}, ${y})
  .pointer_down(:left)
  .release
  .perform
`;
  }

  codeFor_swipe(varNameIgnore, varIndexIgnore, pointerActions) {
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

  // Top-Level Commands

  codeFor_executeScriptNoArgs(scriptCmd) {
    return `driver.execute_script '${scriptCmd}'`;
  }

  codeFor_executeScriptWithArgs(scriptCmd, jsonArg) {
    return `driver.execute_script '${scriptCmd}', ${this.getRubyVal(jsonArg[0])}`;
  }

  codeFor_updateSettings(varNameIgnore, varIndexIgnore, settingsJson) {
    return `driver.update_settings ${this.getRubyVal(settingsJson)}`;
  }

  codeFor_getSettings() {
    return `settings = driver.settings.get`;
  }

  // Session

  codeFor_status() {
    return `status = driver.status`;
  }

  codeFor_getSession() {
    return `session_capabilities = driver.session_capabilities`;
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
    return `timeouts = driver.get_timeouts`;
  }

  codeFor_setTimeouts(/*varNameIgnore, varIndexIgnore, timeoutsJson*/) {
    return '# TODO implement setTimeouts';
  }

  codeFor_getLogTypes() {
    return `log_types = driver.logs.available_types`;
  }

  codeFor_getLogs(varNameIgnore, varIndexIgnore, logType) {
    return `logs = driver.logs.get :${_.lowerCase(logType)}`;
  }

  // Context

  codeFor_getAppiumContext() {
    return `context = driver.current_context`;
  }

  codeFor_getAppiumContexts() {
    return `contexts = driver.available_contexts`;
  }

  codeFor_switchAppiumContext(varNameIgnore, varIndexIgnore, name) {
    return `driver.context = '${name}'`;
  }

  // Device Interaction

  codeFor_getWindowRect() {
    return `window_rect = driver.window_rect`;
  }

  codeFor_takeScreenshot() {
    return `screenshot = driver.screenshot_as :base64`;
  }

  codeFor_isKeyboardShown() {
    return `is_keyboard_shown = driver.keyboard_shown?`;
  }

  codeFor_getOrientation() {
    return `orientation = driver.orientation`;
  }

  codeFor_setOrientation(varNameIgnore, varIndexIgnore, orientation) {
    return `driver.rotation = :${_.lowerCase(orientation)}`;
  }

  codeFor_getGeoLocation() {
    return `location = driver.location`;
  }

  codeFor_setGeoLocation(varNameIgnore, varIndexIgnore, latitude, longitude, altitude) {
    return `driver.set_location ${latitude}, ${longitude}, ${altitude}`;
  }

  codeFor_rotateDevice() {
    return `# Not supported: rotateDevice`;
  }

  // App Management

  codeFor_installApp(varNameIgnore, varIndexIgnore, app) {
    return `driver.install_app '${app}'`;
  }

  codeFor_isAppInstalled(varNameIgnore, varIndexIgnore, app) {
    return `is_app_installed = driver.app_installed? '${app}'`;
  }

  codeFor_activateApp(varNameIgnore, varIndexIgnore, app) {
    return `driver.activate_app '${app}'`;
  }

  codeFor_terminateApp(varNameIgnore, varIndexIgnore, app) {
    return `driver.terminate_app '${app}'`;
  }

  codeFor_removeApp(varNameIgnore, varIndexIgnore, app) {
    return `driver.remove_app '${app}'`;
  }

  codeFor_queryAppState(varNameIgnore, varIndexIgnore, app) {
    return `app_state = driver.query_app_state '${app}'`;
  }

  // File Transfer

  codeFor_pushFile(varNameIgnore, varIndexIgnore, pathToInstallTo, fileContentString) {
    return `driver.push_file '${pathToInstallTo}', '${fileContentString}'`;
  }

  codeFor_pullFile(varNameIgnore, varIndexIgnore, pathToPullFrom) {
    return `driver.pull_file '${pathToPullFrom}'`;
  }

  codeFor_pullFolder(varNameIgnore, varIndexIgnore, folderToPullFrom) {
    return `driver.pull_folder '${folderToPullFrom}'`;
  }

  // Web

  codeFor_navigateTo(varNameIgnore, varIndexIgnore, url) {
    return `driver.get '${url}'`;
  }

  codeFor_getUrl() {
    return `current_url = driver.current_url`;
  }

  codeFor_back() {
    return `driver.back`;
  }

  codeFor_forward() {
    return `driver.navigate.forward`;
  }

  codeFor_refresh() {
    return `driver.navigate.refresh`;
  }

  codeFor_getTitle() {
    return `title = driver.title`;
  }

  codeFor_getWindowHandle() {
    return `window_handle = driver.window_handle`;
  }

  codeFor_closeWindow() {
    return `driver.close`;
  }

  codeFor_switchToWindow(varNameIgnore, varIndexIgnore, handle) {
    return `driver.switch_to.window '${handle}'`;
  }

  codeFor_getWindowHandles() {
    return `window_handles = driver.window_handles`;
  }

  codeFor_createWindow() {
    return `# Not supported: createWindow`;
  }
}
