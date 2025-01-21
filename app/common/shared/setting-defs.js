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
export const ENVIRONMENT_VARIABLES = 'ENVIRONMENT_VARIABLES';

export const DEFAULT_SETTINGS = {
  [PREFERRED_LANGUAGE]: fallbackLng,
  [SAVED_SESSIONS]: [],
  [SET_SAVED_GESTURES]: [],
  [SERVER_ARGS]: null,
  [SESSION_SERVER_PARAMS]: null,
  [SESSION_SERVER_TYPE]: null,
  [SAVED_FRAMEWORK]: 'java',
  [VISIBLE_PROVIDERS]: null,
  [ENVIRONMENT_VARIABLES]: [],
};
