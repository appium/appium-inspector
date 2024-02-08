import {settings} from '../renderer/polyfills';

export const SAVED_SESSIONS = 'SAVED_SESSIONS';
export const SET_SAVED_GESTURES = 'SET_SAVED_GESTURES';
export const SERVER_ARGS = 'SERVER_ARGS';
export const SESSION_SERVER_PARAMS = 'SESSION_SERVER_PARAMS';
export const SESSION_SERVER_TYPE = 'SESSION_SERVER_TYPE';
export const SAVED_FRAMEWORK = 'SAVED_FRAMEWORK';

const DEFAULT_SETTINGS = {
  [SAVED_SESSIONS]: [],
  [SET_SAVED_GESTURES]: [],
  [SERVER_ARGS]: null,
  [SESSION_SERVER_PARAMS]: null,
  [SESSION_SERVER_TYPE]: null,
  [SAVED_FRAMEWORK]: 'java',
};

export async function getSetting(setting) {
  if (await settings.has(setting)) {
    return await settings.get(setting);
  }
  return DEFAULT_SETTINGS[setting];
}

export async function setSetting(setting, value) {
  await settings.set(setting, value);
}

export default settings;
