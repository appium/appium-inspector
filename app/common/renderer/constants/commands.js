/**
 * Only used for the dynamic commands map.
 * Not all Appium commands exist in WDIO, and for those that do, they may have different names.
 * Since commands are retrieved with their Appium names, but executed using their WDIO names,
 * they must be filtered and renamed first, thereby requiring this mapping.
 * Any commands not in this map are considered to be unsupported.
 *
 * NOTE: This map should be updated whenever:
 * * WDIO or Appium adds a new command that already exists in the other tool
 * * WDIO or Appium changes the name of any command in this list
 */
export const APPIUM_TO_WD_COMMANDS = {
  // WDIO WebDriver standard protocol commands
  // https://webdriver.io/docs/api/webdriver
  // createSession: 'newSession', // not applicable for Commands tab
  // deleteSession: 'deleteSession', // not applicable for Commands tab
  getStatus: 'status',
  getTimeouts: 'getTimeouts',
  timeouts: 'setTimeouts',
  getUrl: 'getUrl',
  setUrl: 'navigateTo',
  back: 'back',
  forward: 'forward',
  refresh: 'refresh',
  title: 'getTitle',
  getWindowHandle: 'getWindowHandle',
  closeWindow: 'closeWindow',
  setWindow: 'switchToWindow',
  createNewWindow: 'createWindow',
  getWindowHandles: 'getWindowHandles',
  printPage: 'printPage',
  setFrame: 'switchToFrame',
  switchToParentFrame: 'switchToParentFrame',
  getWindowRect: 'getWindowRect',
  setWindowRect: 'setWindowRect',
  maximizeWindow: 'maximizeWindow',
  minimizeWindow: 'minimizeWindow',
  fullScreenWindow: 'fullscreenWindow',
  findElement: 'findElement',
  findElementFromShadowRoot: 'findElementFromShadowRoot',
  findElements: 'findElements',
  findElementsFromShadowRoot: 'findElementsFromShadowRoot',
  findElementFromElement: 'findElementFromElement',
  findElementsFromElement: 'findElementsFromElement',
  elementShadowRoot: 'getElementShadowRoot',
  active: 'getActiveElement',
  elementSelected: 'isElementSelected',
  elementDisplayed: 'isElementDisplayed',
  getAttribute: 'getElementAttribute',
  getProperty: 'getElementProperty',
  getCssProperty: 'getElementCSSValue',
  getText: 'getElementText',
  getName: 'getElementTagName',
  getElementRect: 'getElementRect',
  elementEnabled: 'isElementEnabled',
  click: 'elementClick', // also WDIO touchClick (removed in Appium 3)
  clear: 'elementClear',
  setValue: 'elementSendKeys',
  getPageSource: 'getPageSource',
  execute: 'executeScript',
  executeAsync: 'executeAsyncScript',
  getCookies: 'getAllCookies',
  setCookie: 'addCookie',
  deleteCookies: 'deleteAllCookies',
  getCookie: 'getNamedCookie',
  deleteCookie: 'deleteCookie',
  performActions: 'performActions',
  releaseActions: 'releaseActions',
  postDismissAlert: 'dismissAlert',
  postAcceptAlert: 'acceptAlert',
  getAlertText: 'getAlertText',
  setAlertText: 'sendAlertText',
  getScreenshot: 'takeScreenshot',
  getElementScreenshot: 'takeElementScreenshot',
  getComputedRole: 'getElementComputedRole',
  getComputedLabel: 'getElementComputedLabel',
  // WDIO WebDriver extended protocol commands
  // https://webdriver.io/docs/api/webdriver
  setPermissions: 'setPermissions',
  generateTestReport: 'generateTestReport',
  createVirtualSensor: 'createMockSensor',
  getVirtualSensorInfo: 'getMockSensor',
  updateVirtualSensorReading: 'updateMockSensor',
  deleteVirtualSensor: 'deleteMockSensor',
  addVirtualAuthenticator: 'addVirtualAuthenticator',
  removeVirtualAuthenticator: 'removeVirtualAuthenticator',
  addAuthCredential: 'addCredential',
  getAuthCredential: 'getCredentials',
  removeAllAuthCredentials: 'removeAllCredentials',
  removeAuthCredential: 'removeCredential',
  setUserAuthVerified: 'setUserVerified',
  // WDIO MJSONWP commands
  // https://webdriver.io/docs/api/mjsonwp
  getNetworkConnection: 'getNetworkConnection',
  setNetworkConnection: 'setNetworkConnection',
  // WDIO Appium protocol commands (includes some JSONWP/MJSONWP)
  // https://webdriver.io/docs/api/appium
  getLog: 'getLogs',
  getLogTypes: 'getLogTypes',
  getSession: 'getSession',
  getCurrentContext: 'getAppiumContext',
  getContexts: 'getAppiumContexts',
  setContext: 'switchAppiumContext',
  listCommands: 'getAppiumCommands',
  listExtensions: 'getAppiumExtensions',
  getAppiumSessionCapabilities: 'getAppiumSessionCapabilities',
  setRotation: 'rotateDevice',
  installApp: 'installApp',
  activateApp: 'activateApp',
  removeApp: 'removeApp',
  terminateApp: 'terminateApp',
  isAppInstalled: 'isAppInstalled',
  queryAppState: 'queryAppState',
  hideKeyboard: 'hideKeyboard',
  isKeyboardShown: 'isKeyboardShown',
  pushFile: 'pushFile',
  pullFile: 'pullFile',
  pullFolder: 'pullFolder',
  getDeviceTime: 'getDeviceTime',
  getSettings: 'getSettings',
  updateSettings: 'updateSettings',
  executeDriverScript: 'executeDriverScript', // execute-driver-plugin
  getLogEvents: 'getEvents',
  logCustomEvent: 'logEvent',
  compareImages: 'compareImages', // images-plugin
  availableIMEEngines: 'availableIMEEngines',
  getActiveIMEEngine: 'getActiveIMEEngine',
  isIMEActivated: 'isIMEActivated',
  deactivateIMEEngine: 'deactivateIMEEngine',
  activateIMEEngine: 'activateIMEEngine',
  getOrientation: 'getOrientation',
  setOrientation: 'setOrientation',
  setGeoLocation: 'setGeoLocation',
  getGeoLocation: 'getGeoLocation',
  // WDIO Appium protocol commands removed in Appium 3
  mobileShake: 'shake',
  lock: 'lock',
  unlock: 'unlock',
  isLocked: 'isLocked',
  startRecordingScreen: 'startRecordingScreen', // moved to drivers
  stopRecordingScreen: 'stopRecordingScreen', // moved to drivers
  getPerformanceDataTypes: 'getPerformanceDataTypes',
  getPerformanceData: 'getPerformanceData',
  pressKeyCode: 'pressKeyCode',
  longPressKeyCode: 'longPressKeyCode',
  keyevent: 'sendKeyEvent',
  getCurrentActivity: 'getCurrentActivity',
  getCurrentPackage: 'getCurrentPackage',
  toggleFlightMode: 'toggleAirplaneMode',
  toggleData: 'toggleData',
  toggleWiFi: 'toggleWiFi',
  toggleLocationServices: 'toggleLocationServices',
  networkSpeed: 'toggleNetworkSpeed',
  openNotifications: 'openNotifications',
  startActivity: 'startActivity',
  getSystemBars: 'getSystemBars',
  getDisplayDensity: 'getDisplayDensity',
  touchId: 'touchId',
  toggleEnrollTouchId: 'toggleEnrollTouchId',
  launchApp: 'launchApp',
  closeApp: 'closeApp',
  background: 'background',
  endCoverage: 'endCoverage',
  getStrings: 'getStrings',
  setValueImmediate: 'setValueImmediate',
  replaceValue: 'replaceValue',
  receiveAsyncResponse: 'receiveAsyncResponse',
  gsmCall: 'gsmCall',
  gsmSignal: 'gsmSignal',
  powerCapacity: 'powerCapacity',
  powerAC: 'powerAC',
  gsmVoice: 'gsmVoice',
  sendSMS: 'sendSms',
  fingerprint: 'fingerPrint',
  setClipboard: 'setClipboard',
  getClipboard: 'getClipboard',
  performTouch: 'touchPerform',
  performMultiAction: 'multiTouchPerform',
  implicitWait: 'implicitWait',
  getLocationInView: 'getLocationInView',
  keys: 'sendKeys',
  asyncScriptTimeout: 'asyncScriptTimeout',
  submit: 'submit',
  getSize: 'getElementSize',
  getLocation: 'getElementLocation',
  touchDown: 'touchDown',
  touchUp: 'touchUp',
  touchMove: 'touchMove',
  touchLongClick: 'touchLongClick',
  flick: 'touchFlick',
};

/**
 * Only used for the dynamic commands map.
 * Certain commands differ in their signature between Appium and WDIO,
 * so the WDIO formats must be explicitly defined.
 * Any URL parameters are excluded, as they are handled separately.
 */
export const COMMANDS_WITH_MISMATCHED_PARAMS = {
  execute: [
    // The WebDriver spec requires 'args' to be an array
    // (https://w3c.github.io/webdriver/#dfn-extract-the-script-arguments-from-a-request),
    // but if the script doesn't use any arguments, we allow the user to omit it.
    // This is handled in Commands.jsx:prepareCommand.
    {name: 'script', required: true},
    {name: 'args', required: false},
  ],
  timeouts: [
    // different order, no non-W3C params
    {name: 'implicit', required: false},
    {name: 'pageLoad', required: false},
    {name: 'script', required: false},
  ],
  printPage: [
    // page & margin separated into components
    {name: 'orientation', required: false},
    {name: 'scale', required: false},
    {name: 'background', required: false},
    {name: 'width', required: false},
    {name: 'height', required: false},
    {name: 'top', required: false},
    {name: 'bottom', required: false},
    {name: 'left', required: false},
    {name: 'right', required: false},
    {name: 'shrinkToFit', required: false},
    {name: 'pageRanges', required: false},
  ],
  addAuthCredential: [
    // userHandle & signCount are required
    {name: 'credentialId', required: true},
    {name: 'isResidentCredential', required: true},
    {name: 'rpId', required: true},
    {name: 'privateKey', required: true},
    {name: 'userHandle', required: true},
    {name: 'signCount', required: true},
    {name: 'largeBlob', required: false},
  ],
  setUserAuthVerified: [], // no isUserVerified property
  getDeviceTime: [], // only GET endpoint is supported
  installApp: [{name: 'appPath', required: true}], // no options
  activateApp: [{name: 'appId', required: true}], // no bundleId & options
  removeApp: [{name: 'appId', required: true}], // no bundleId & options
  terminateApp: [{name: 'appId', required: true}], // no bundleId
  isAppInstalled: [{name: 'appId', required: true}], // no bundleId
  queryAppState: [{name: 'appId', required: true}], // no bundleId
  getLogEvents: [{name: 'type', required: true}], // type is required
  stopRecordingScreen: [
    // options separated into components
    {name: 'remotePath', required: false},
    {name: 'username', required: false},
    {name: 'password', required: false},
    {name: 'method', required: false},
  ],
};

/**
 * Only used for the static commands map.
 * Commonly used commands not hidden under a collapse.
 */
export const TOP_LEVEL_COMMANDS = {
  executeScript: {
    params: [
      {name: 'script', required: true},
      {name: 'args', required: false},
    ],
  },
  updateSettings: {
    params: [{name: 'settings', required: true}],
  },
  getSettings: {},
};

/**
 * Only used for the static commands map.
 * Defines the full mapping of categories and commands.
 *
 * NOTE: When changing top-level categories, update `en/translation.json`
 */
export const COMMAND_DEFINITIONS = {
  Session: {
    status: {},
    getSession: {},
    getAppiumCommands: {},
    getAppiumExtensions: {},
    getAppiumSessionCapabilities: {},
    getTimeouts: {},
    setTimeouts: {
      params: [
        {name: 'implicit', required: false},
        {name: 'pageLoad', required: false},
        {name: 'script', required: false},
      ],
    },
    getLogTypes: {},
    getLogs: {
      params: [{name: 'type', required: true}],
    },
  },
  Context: {
    getAppiumContext: {},
    getAppiumContexts: {},
    switchAppiumContext: {
      params: [{name: 'name', required: true}],
      refresh: true,
    },
  },
  'Device Interaction': {
    getWindowRect: {},
    takeScreenshot: {},
    getDeviceTime: {},
    hideKeyboard: {
      refresh: true,
    },
    isKeyboardShown: {},
    getOrientation: {},
    setOrientation: {
      params: [{name: 'orientation', required: true}],
      refresh: true,
    },
    getGeoLocation: {},
    setGeoLocation: {
      params: [{name: 'location', required: true}],
    },
    rotateDevice: {
      params: [
        {name: 'x', required: true},
        {name: 'y', required: true},
        {name: 'z', required: true},
      ],
      refresh: true,
    },
  },
  'App Management': {
    installApp: {
      params: [{name: 'appPath', required: true}],
    },
    isAppInstalled: {
      params: [{name: 'appId', required: true}],
    },
    activateApp: {
      params: [{name: 'appId', required: true}],
      refresh: true,
    },
    terminateApp: {
      params: [{name: 'appId', required: true}],
      refresh: true,
    },
    removeApp: {
      params: [{name: 'appId', required: true}],
    },
    queryAppState: {
      params: [{name: 'appId', required: true}],
    },
  },
  'File Transfer': {
    pushFile: {
      params: [
        {name: 'path', required: true},
        {name: 'data', required: true},
      ],
    },
    pullFile: {
      params: [{name: 'path', required: true}],
    },
    pullFolder: {
      params: [{name: 'path', required: true}],
    },
  },
  Web: {
    navigateTo: {
      params: [{name: 'url', required: true}],
      refresh: true,
    },
    getUrl: {},
    back: {
      refresh: true,
    },
    forward: {
      refresh: true,
    },
    refresh: {
      refresh: true,
    },
    getTitle: {},
    getWindowHandle: {},
    closeWindow: {
      refresh: true,
    },
    switchToWindow: {
      params: [{name: 'handle', required: true}],
      refresh: true,
    },
    getWindowHandles: {},
    createWindow: {
      params: [{name: 'type', required: true}],
      refresh: true,
    },
  },
};
