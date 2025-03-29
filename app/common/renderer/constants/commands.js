import {DRIVERS} from './common';

export const COMMAND_ARG_TYPES = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
};

const {STRING, NUMBER} = COMMAND_ARG_TYPES;
const {UIAUTOMATOR2, ESPRESSO, XCUITEST} = DRIVERS;

// Note: When changing COMMAND_DEFINITIONS categories, or 'notes' for any command, update `en/translation.json`
export const COMMAND_DEFINITIONS = {
  'Execute Script': {
    executeScript: {
      args: [
        ['executeScriptCommand', STRING],
        ['jsonArgument', STRING],
      ],
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
  'Device Interaction': {
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
  Keyboard: {
    hideKeyboard: {
      refresh: true,
    },
    isKeyboardShown: {},
  },
  System: {
    getDeviceTime: {},
    getWindowRect: {},
    takeScreenshot: {},
  },
  Session: {
    status: {},
    getSession: {},
    getTimeouts: {},
    setTimeouts: {
      args: [
        ['implicitTimeout', NUMBER],
        ['pageLoadTimeout', NUMBER],
        ['scriptTimeout', NUMBER],
      ],
    },
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
    getLogTypes: {},
    getLogs: {
      args: [['logType', STRING]],
    },
    updateSettings: {
      args: [['settingsJson', STRING]],
    },
    getSettings: {},
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
  },
  Context: {
    getContext: {},
    getContexts: {},
    switchContext: {
      args: [['name', STRING]],
      refresh: true,
    },
  },
  'Window (W3C)': {
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
