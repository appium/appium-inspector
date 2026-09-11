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
export const IMPORTANT_SOURCE_ATTRIBUTES = 'IMPORTANT_SOURCE_ATTRIBUTES';

// Attributes which are listed in the source by default
export const IMPORTANT_SOURCE_ATTRS = [
  'AXDescription',
  'AXIdentifier',
  'content-desc',
  'id',
  'label',
  'name',
  'resource-id',
  'text',
  'value',
];

export const DEFAULT_SETTINGS = {
  [PREFERRED_LANGUAGE]: fallbackLng,
  [PREFERRED_THEME]: 'system',
  [SAVED_SESSIONS]: [],
  [SET_SAVED_GESTURES]: [],
  [SERVER_ARGS]: null,
  [SESSION_SERVER_PARAMS]: null,
  [SESSION_SERVER_TYPE]: null,
  [SAVED_CLIENT_FRAMEWORK]: 'java',
  [VISIBLE_PROVIDERS]: null,
  [IMPORTANT_SOURCE_ATTRIBUTES]: IMPORTANT_SOURCE_ATTRS,
};
