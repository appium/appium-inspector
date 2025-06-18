// Definitions for all the persistent settings used in the app

import {fallbackLng} from './i18next.config';

export const PREFERRED_LANGUAGE = 'PREFERRED_LANGUAGE';
export const SAVED_SESSIONS = 'SAVED_SESSIONS';
export const SET_SAVED_GESTURES = 'SET_SAVED_GESTURES';
export const SERVER_ARGS = 'SERVER_ARGS';
export const SESSION_SERVER_PARAMS = 'SESSION_SERVER_PARAMS';
export const SESSION_SERVER_TYPE = 'SESSION_SERVER_TYPE';
export const SAVED_FRAMEWORK = 'SAVED_FRAMEWORK';
export const VISIBLE_PROVIDERS = 'VISIBLE_PROVIDERS';
export const REQUIRED_PARAMS_FOR_PREFILLING = ['remoteHost', 'remotePort', 'remotePath', 'sessionId'];

const url = new URL(window.location.href);

// utility function to check if all required URL parameters for pre-filling are present
export const checkIfAllParamsPresent = () => {
  let isAllParamsPresent = true;
  REQUIRED_PARAMS_FOR_PREFILLING.forEach((param) => {
    if (!url.searchParams.get(param)) {
      isAllParamsPresent = false;
    }
  });
  window.AppLiveSessionId = url.searchParams.get('sessionId') || null;
  return isAllParamsPresent;
};

export const DEFAULT_SETTINGS = {
  [PREFERRED_LANGUAGE]: fallbackLng,
  [SAVED_SESSIONS]: [],
  [SET_SAVED_GESTURES]: [],
  [SERVER_ARGS]: null,
  // Try to pre-fill session server parameters from URL if available
  [SESSION_SERVER_PARAMS]: checkIfAllParamsPresent() ? {
    'remote': {
      'ssl': true,
      'hostname': url.searchParams.get('remoteHost'),
      'port': url.searchParams.get('remotePort'),
      'path': url.searchParams.get('remotePath')
  }
  } : null,
  [SESSION_SERVER_TYPE]: null,
  [SAVED_FRAMEWORK]: 'java',
  [VISIBLE_PROVIDERS]: null,
};
