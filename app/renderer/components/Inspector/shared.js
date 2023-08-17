import { DOMParser } from '@xmldom/xmldom';
import xpath from 'xpath';

export function pixelsToPercentage (px, maxPixels) {
  if (!isNaN(px)) {
    return parseFloat(((px / maxPixels) * 100).toFixed(1), 10);
  }
}

export function percentageToPixels (pct, maxPixels) {
  if (!isNaN(pct)) {
    return Math.round(maxPixels * (pct / 100));
  }
}

export function parseCoordinates (element) {
  let {bounds, x, y, width, height} = element.attributes || {};

  if (bounds) {
    let boundsArray = bounds.split(/\[|\]|,/).filter((str) => str !== '');
    const x1 = parseInt(boundsArray[0], 10);
    const x2 = parseInt(boundsArray[2], 10);
    const y1 = parseInt(boundsArray[1], 10);
    const y2 = parseInt(boundsArray[3], 10);
    return { x1, y1, x2, y2 };
  } else if (x) {
    x = parseInt(x, 10);
    y = parseInt(y, 10);
    width = parseInt(width, 10);
    height = parseInt(height, 10);
    return {x1: x, y1: y, x2: x + width, y2: y + height};
  } else {
    return {};
  }
}

export function isUnique (attrName, attrValue, sourceXML) {
  // If no sourceXML provided, assume it's unique
  if (!sourceXML) {
    return true;
  }
  const doc = new DOMParser().parseFromString(sourceXML);
  return xpath.select(`//*[@${attrName}="${attrValue.replace(/"/g, '')}"]`, doc).length < 2;
}

// Map of the optimal strategies.
const STRATEGY_MAPPINGS = [
  ['name', 'accessibility id'],
  ['content-desc', 'accessibility id'],
  ['id', 'id'],
  ['rntestid', 'id'],
  ['resource-id', 'id'],
  ['class', 'class name'],
  ['type', 'class name'],
];

export function getLocators (attributes, sourceXML) {
  const res = {};
  for (let [strategyAlias, strategy] of STRATEGY_MAPPINGS) {
    const value = attributes[strategyAlias];
    if (value && isUnique(strategyAlias, value, sourceXML)) {
      res[strategy] = attributes[strategyAlias];
    }
  }
  return res;
}

export const POINTER_TYPES = {
  POINTER_UP: 'pointerUp',
  POINTER_DOWN: 'pointerDown',
  PAUSE: 'pause',
  POINTER_MOVE: 'pointerMove'
};

export const DEFAULT_SWIPE = {
  POINTER_NAME: 'finger1',
  DURATION_1: 0,
  DURATION_2: 750,
  BUTTON: 0,
  ORIGIN: 'viewport'
};

export const DEFAULT_TAP = {
  POINTER_NAME: 'finger1',
  DURATION_1: 0,
  DURATION_2: 100,
  BUTTON: 0
};

// 3 Types of Centroids:
// CENTROID is the circle/square displayed on the screen
// EXPAND is the +/- circle displayed on the screen
// OVERLAP is the same as CENTROID but is only visible when clicked on +/- circle
export const RENDER_CENTROID_AS = {
  CENTROID: 'centroid',
  EXPAND: 'expand',
  OVERLAP: 'overlap'
};

export const SCREENSHOT_INTERACTION_MODE = {
  SELECT: 'select',
  SWIPE: 'swipe',
  TAP: 'tap',
  GESTURE: 'gesture',
};

export const APP_MODE = {
  NATIVE: 'native',
  WEB_HYBRID: 'web_hybrid',
};

export const COMMAND_ARG_TYPES = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
};

const { STRING, NUMBER, BOOLEAN } = COMMAND_ARG_TYPES;

// Note: When adding or removing COMMAND_DEFINITIONS categories, update `en/translation.json`
export const COMMAND_DEFINITIONS = {
  'Execute Script': {
    'executeScript': {
      args: [['executeScriptCommand', STRING], ['jsonArgument', STRING]]
    }
  },
  'App Management': {
    'startActivity': {
      args: [
        ['appPackage', STRING], ['appActivity', STRING], ['appWaitPackage', STRING],
        ['intentAction', STRING], ['intentCategory', STRING], ['intentFlags', STRING],
        ['optionalIntentArguments', STRING], ['dontStopAppOnReset', STRING]
      ],
      refresh: true
    },
    'getCurrentActivity': {},
    'getCurrentPackage': {},
    'installApp': {
      args: [['appPathOrUrl', STRING]]
    },
    'isAppInstalled': {
      args: [['appId', STRING]]
    },
    'background': {
      args: [['timeout', NUMBER]],
      refresh: true
    },
    'activateApp': {
      args: [['appId', STRING]],
      refresh: true
    },
    'terminateApp': {
      args: [['appId', STRING]],
      refresh: true
    },
    'removeApp': {
      args: [['appId', STRING]]
    },
    'getStrings': {
      args: [['language', STRING], ['stringFile', STRING]],
      refresh: true
    },
  },
  'Clipboard': {
    'getClipboard': {},
    'setClipboard': {
      args: [['clipboardText', STRING], ['contentType', STRING], ['contentLabel', STRING]]
    },
  },
  'File Transfer': {
    'pushFile': {
      args: [['pathToInstallTo', STRING], ['fileContentString', STRING]]
    },
    'pullFile': {
      args: [['pathToPullFrom', STRING]]
    },
    'pullFolder': {
      args: [['folderToPullFrom', STRING]]
    },
  },
  'Device Interaction': {
    'shake': {},
    'lock': {
      args: [['seconds', NUMBER]],
      refresh: true
    },
    'unlock': {
      refresh: true
    },
    'isLocked': {},
    'rotateDevice': {
      args: [
        ['x', NUMBER], ['y', NUMBER], ['duration', NUMBER], ['radius', NUMBER],
        ['rotation', NUMBER], ['touchCount', NUMBER]
      ],
      refresh: true
    },
    'fingerPrint': { // Android only
      args: [['fingerPrintId', NUMBER]],
      refresh: true
    },
    'touchId': { // iOS simulator only
      args: [['shouldMatch', BOOLEAN]],
      refresh: true
    },
    'toggleEnrollTouchId': { // iOS simulator only
      args: [['shouldEnroll', BOOLEAN]]
    },
  },
  'Keyboard': {
    'pressKeyCode': {
      args: [['keyCode', NUMBER], ['metaState', NUMBER], ['flags', NUMBER]],
      refresh: true
    },
    'longPressKeyCode': {
      args: [['keyCode', NUMBER], ['metaState', NUMBER], ['flags', NUMBER]],
      refresh: true
    },
    'hideKeyboard': {
      refresh: true
    },
    'isKeyboardShown': {},
  },
  'Connectivity': {
    'toggleAirplaneMode': {},
    'toggleData': {},
    'toggleWiFi': {},
    'toggleLocationServices': {},
    'sendSMS': {
      args: [['phoneNumber', STRING], ['text', STRING]]
    },
    'gsmCall': {
      args: [['phoneNumber', STRING], ['action', STRING]]
    },
    'gsmSignal': {
      args: [['signalStrengh', NUMBER]]
    },
    'gsmVoice': {
      args: [['state', STRING]]
    },
  },
  'Performance Data': {
    'getPerformanceData': {
      args: [['packageName', STRING], ['dataType', STRING], ['dataReadTimeout', NUMBER]]
    },
    'getPerformanceDataTypes': {},
  },
  'System': {
    'openNotifications': {
      refresh: true
    },
    'getDeviceTime': {},
  },
  'Session': {
    'getSession': {},
    'setTimeouts': {
      args: [['implicitTimeout', NUMBER], ['pageLoadTimeout', NUMBER], ['scriptTimeout', NUMBER]]
    },
    'getOrientation': {},
    'setOrientation': {
      args: [['orientation', STRING]],
      refresh: true
    },
    'getGeoLocation': {},
    'setGeoLocation': {
      args: [['latitude', NUMBER], ['longitude', NUMBER], ['altitude', NUMBER]]
    },
    'getLogTypes': {},
    'getLogs': {
      args: [['logType', STRING]]
    },
    'updateSettings': {
      args: [['settingsJson', STRING]]
    },
    'getSettings': {},
  },
  'Web': {
    'navigateTo': {
      args: [['url', STRING]],
      refresh: true
    },
    'getUrl': {},
    'back': {
      refresh: true
    },
    'forward': {
      refresh: true
    },
    'refresh': {
      refresh: true
    }
  },
  'Context': {
    'getContext': {},
    'getContexts': {},
    'switchContext': {
      args: [['name', STRING]],
      refresh: true
    }
  },
  'Window (W3C)': {
    'getWindowHandle': {},
    'closeWindow': {
      refresh: true
    },
    'switchToWindow': {
      args: [['handle', STRING]],
      refresh: true
    },
    'getWindowHandles': {},
    'createWindow': {
      args: [['type', STRING]],
      refresh: true
    }
  }
};

export const INTERACTION_MODE = {
  SOURCE: 'source',
  COMMANDS: 'commands',
  GESTURES: 'gestures',
  SESSION_INFO: 'sessionInfo',
};
