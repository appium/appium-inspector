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
  createSession: 'newSession',
  deleteSession: 'deleteSession',
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
 * Certain commands supported in both Appium & WDIO must still be excluded from the Commands list,
 * either because they are not applicable, or have parameter mismatches that need complex workarounds
 */
export const EXCLUDED_COMMANDS = [
  // not applicable for Commands tab
  'createSession',
  'deleteSession',
  // Appium also supports non-W3C arguments, and has a different order,
  // while WDIO doesn't support null values
  'timeouts',
  // WDIO is missing the isUserVerified property
  'setUserAuthVerified',
  // WDIO only supports 4 individual parameters instead of a single options object,
  // like startRecordingScreen
  'stopRecordingScreen',
];

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
