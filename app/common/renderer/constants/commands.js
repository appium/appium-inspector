import {DRIVERS} from './common';

export const COMMAND_ARG_TYPES = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
};

const {STRING, NUMBER, BOOLEAN} = COMMAND_ARG_TYPES;
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
    startActivity: {
      args: [
        ['appPackage', STRING],
        ['appActivity', STRING],
        ['appWaitPackage', STRING],
        ['intentAction', STRING],
        ['intentCategory', STRING],
        ['intentFlags', STRING],
        ['optionalIntentArguments', STRING],
        ['dontStopAppOnReset', STRING],
      ],
      drivers: [UIAUTOMATOR2, ESPRESSO],
      refresh: true,
    },
    getCurrentActivity: {
      drivers: [UIAUTOMATOR2, ESPRESSO],
    },
    getCurrentPackage: {
      drivers: [UIAUTOMATOR2, ESPRESSO],
    },
    installApp: {
      args: [['appPathOrUrl', STRING]],
    },
    isAppInstalled: {
      args: [['appId', STRING]],
    },
    background: {
      args: [['timeout', NUMBER]],
      refresh: true,
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
    getStrings: {
      args: [
        ['language', STRING],
        ['stringFile', STRING],
      ],
      refresh: true,
    },
  },
  Clipboard: {
    getClipboard: {},
    setClipboard: {
      args: [
        ['clipboardText', STRING],
        ['contentType', STRING],
        ['contentLabel', STRING],
      ],
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
    shake: {},
    lock: {
      args: [['seconds', NUMBER]],
      refresh: true,
    },
    unlock: {
      refresh: true,
    },
    isLocked: {},
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
    fingerPrint: {
      args: [['fingerPrintId', NUMBER]],
      drivers: [UIAUTOMATOR2, ESPRESSO],
      notes: ['simulatorOnly', ['minAndroidSDK', 23]],
      refresh: true,
    },
    touchId: {
      args: [['shouldMatch', BOOLEAN]],
      drivers: [XCUITEST],
      notes: ['simulatorOnly'],
      refresh: true,
    },
    toggleEnrollTouchId: {
      args: [['shouldEnroll', BOOLEAN]],
      drivers: [XCUITEST],
      notes: ['simulatorOnly'],
    },
  },
  Keyboard: {
    pressKeyCode: {
      args: [
        ['keyCode', NUMBER],
        ['metaState', NUMBER],
        ['flags', NUMBER],
      ],
      refresh: true,
    },
    longPressKeyCode: {
      args: [
        ['keyCode', NUMBER],
        ['metaState', NUMBER],
        ['flags', NUMBER],
      ],
      refresh: true,
    },
    hideKeyboard: {
      refresh: true,
    },
    isKeyboardShown: {},
  },
  Connectivity: {
    toggleAirplaneMode: {},
    toggleData: {},
    toggleWiFi: {},
    toggleLocationServices: {},
    sendSMS: {
      args: [
        ['phoneNumber', STRING],
        ['text', STRING],
      ],
    },
    gsmCall: {
      args: [
        ['phoneNumber', STRING],
        ['action', STRING],
      ],
    },
    gsmSignal: {
      args: [['signalStrengh', NUMBER]],
    },
    gsmVoice: {
      args: [['state', STRING]],
    },
  },
  'Performance Data': {
    getPerformanceData: {
      args: [
        ['packageName', STRING],
        ['dataType', STRING],
        ['dataReadTimeout', NUMBER],
      ],
    },
    getPerformanceDataTypes: {},
  },
  System: {
    openNotifications: {
      refresh: true,
    },
    getDeviceTime: {},
  },
  Session: {
    getSession: {},
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
