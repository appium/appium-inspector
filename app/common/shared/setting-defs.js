// Definitions for all the persistent settings used in the app

import {fallbackLng} from './i18next.config.js';

export const PREFERRED_LANGUAGE = 'PREFERRED_LANGUAGE';
export const PREFERRED_THEME = 'PREFERRED_THEME';
export const SAVED_SESSIONS = 'SAVED_SESSIONS';
export const SET_SAVED_GESTURES = 'SET_SAVED_GESTURES';
export const SERVER_ARGS = 'SERVER_ARGS';
export const SESSION_SERVER_PARAMS = 'SESSION_SERVER_PARAMS';
export const SESSION_SERVER_TYPE = 'SESSION_SERVER_TYPE';
export const SAVED_CLIENT_FRAMEWORK = 'SAVED_FRAMEWORK';
export const VISIBLE_PROVIDERS = 'VISIBLE_PROVIDERS';

export const REQUIRED_PARAMS_FOR_PREFILLING = ['remoteHost', 'remotePort', 'remotePath', 'sessionId'];

const _url = new URL(typeof window !== 'undefined' ? window.location.href : 'http://localhost/');

// Returns true when all 4 AppLive URL params are present.
// Also stores sessionId on window.AppLiveSessionId for use by auto-attach logic.
export const checkIfAllParamsPresent = () => {
  const allPresent = REQUIRED_PARAMS_FOR_PREFILLING.every((p) => !!_url.searchParams.get(p));
  if (typeof window !== 'undefined') {
    window.AppLiveSessionId = _url.searchParams.get('sessionId') || null;
  }
  return allPresent;
};

export const DEFAULT_SETTINGS = {
  [PREFERRED_LANGUAGE]: fallbackLng,
  [PREFERRED_THEME]: 'system',
  [SAVED_SESSIONS]: [],
  [SET_SAVED_GESTURES]: [],
  [SERVER_ARGS]: null,
  [SESSION_SERVER_PARAMS]: checkIfAllParamsPresent()
    ? {
        remote: {
          ssl: true,
          hostname: _url.searchParams.get('remoteHost'),
          port: _url.searchParams.get('remotePort'),
          path: _url.searchParams.get('remotePath'),
        },
      }
    : null,
  [SESSION_SERVER_TYPE]: null,
  [SAVED_CLIENT_FRAMEWORK]: 'java',
  [VISIBLE_PROVIDERS]: null,
};
