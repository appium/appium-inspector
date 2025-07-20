export const COMMAND_ARG_TYPES = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
};

const {STRING, NUMBER} = COMMAND_ARG_TYPES;

// Commonly used commands not hidden under a collapse
export const TOP_LEVEL_COMMANDS = {
  executeScript: {
    args: [
      ['executeScriptCommand', STRING],
      ['jsonArgument', STRING],
    ],
  },
  updateSettings: {
    args: [['settingsJson', STRING]],
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
      args: [
        ['implicitTimeout', NUMBER],
        ['pageLoadTimeout', NUMBER],
        ['scriptTimeout', NUMBER],
      ],
    },
    getLogTypes: {},
    getLogs: {
      args: [['logType', STRING]],
    },
  },
  Context: {
    getAppiumContext: {},
    getAppiumContexts: {},
    switchAppiumContext: {
      args: [['name', STRING]],
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
      args: [['orientation', STRING]],
      refresh: true,
    },
    getGeoLocation: {},
    setGeoLocation: {
      args: [
        ['latitude', NUMBER],
        ['longitude', NUMBER],
        ['altitude', NUMBER],
      ],
    },
    rotateDevice: {
      args: [
        ['x', NUMBER],
        ['y', NUMBER],
        ['duration', NUMBER],
        ['radius', NUMBER],
        ['rotation', NUMBER],
        ['touchCount', NUMBER],
      ],
      refresh: true,
    },
  },
  'App Management': {
    installApp: {
      args: [['appPathOrUrl', STRING]],
    },
    isAppInstalled: {
      args: [['appId', STRING]],
    },
    activateApp: {
      args: [['appId', STRING]],
      refresh: true,
    },
    terminateApp: {
      args: [['appId', STRING]],
      refresh: true,
    },
    removeApp: {
      args: [['appId', STRING]],
    },
    queryAppState: {
      args: [['appId', STRING]],
    },
  },
  'File Transfer': {
    pushFile: {
      args: [
        ['pathToInstallTo', STRING],
        ['fileContentString', STRING],
      ],
    },
    pullFile: {
      args: [['pathToPullFrom', STRING]],
    },
    pullFolder: {
      args: [['folderToPullFrom', STRING]],
    },
  },
  Web: {
    navigateTo: {
      args: [['url', STRING]],
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
      args: [['handle', STRING]],
      refresh: true,
    },
    getWindowHandles: {},
    createWindow: {
      args: [['type', STRING]],
      refresh: true,
    },
  },
};
