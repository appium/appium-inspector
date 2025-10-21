// Commonly used commands not hidden under a collapse
export const TOP_LEVEL_COMMANDS = {
  executeScript: {
    args: [['executeScriptCommand'], ['jsonArgument']],
  },
  updateSettings: {
    args: [['settingsJson']],
  },
  getSettings: {},
};

// Note: When changing COMMAND_DEFINITIONS categories, or 'notes' for any command, update `en/translation.json`
export const COMMAND_DEFINITIONS = {
  Session: {
    status: {},
    getSession: {},
    getAppiumCommands: {},
    getAppiumExtensions: {},
    getAppiumSessionCapabilities: {},
    getTimeouts: {},
    setTimeouts: {
      args: [['implicitTimeout'], ['pageLoadTimeout'], ['scriptTimeout']],
    },
    getLogTypes: {},
    getLogs: {
      args: [['logType']],
    },
  },
  Context: {
    getAppiumContext: {},
    getAppiumContexts: {},
    switchAppiumContext: {
      args: [['name']],
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
      args: [['orientation']],
      refresh: true,
    },
    getGeoLocation: {},
    setGeoLocation: {
      args: [['latitude'], ['longitude'], ['altitude']],
    },
    rotateDevice: {
      args: [['x'], ['y'], ['duration'], ['radius'], ['rotation'], ['touchCount']],
      refresh: true,
    },
  },
  'App Management': {
    installApp: {
      args: [['appPathOrUrl']],
    },
    isAppInstalled: {
      args: [['appId']],
    },
    activateApp: {
      args: [['appId']],
      refresh: true,
    },
    terminateApp: {
      args: [['appId']],
      refresh: true,
    },
    removeApp: {
      args: [['appId']],
    },
    queryAppState: {
      args: [['appId']],
    },
  },
  'File Transfer': {
    pushFile: {
      args: [['pathToInstallTo'], ['fileContentString']],
    },
    pullFile: {
      args: [['pathToPullFrom']],
    },
    pullFolder: {
      args: [['folderToPullFrom']],
    },
  },
  Web: {
    navigateTo: {
      args: [['url']],
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
      args: [['handle']],
      refresh: true,
    },
    getWindowHandles: {},
    createWindow: {
      args: [['type']],
      refresh: true,
    },
  },
};
