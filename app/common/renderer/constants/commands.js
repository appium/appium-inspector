/**
 * Only used for the dynamic commands map.
 * Some Appium commands may not exist in WDIO, or the same command can have different names.
 * Since the commands are retrieved using Appium endpoints, but executed using WDIO,
 * they must be renamed first. This map is a reference list of all WebDriver/MJSONWP/Appium
 * commands supported in WDIO, with the Appium command names mapped to them.
 * Any commands not in this list are considered to be unsupported.
 *
 * NOTE: This map must be updated whenever:
 * * WDIO or Appium adds a new command that already exists in the other tool
 * * WDIO or Appium changes the name of any command in this list
 */
export const APPIUM_TO_WD_COMMANDS = {
  // WebDriver standard protocol commands
  createSession: 'newSession',
  // Appium protocol commands
  listExtensions: 'getAppiumExtensions',
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
      params: [
        {name: 'latitude', required: true},
        {name: 'longitude', required: true},
        {name: 'altitude', required: true},
      ],
    },
    rotateDevice: {
      params: [
        {name: 'x', required: false},
        {name: 'y', required: false},
        {name: 'duration', required: false},
        {name: 'radius', required: false},
        {name: 'rotation', required: false},
        {name: 'touchCount', required: false},
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
