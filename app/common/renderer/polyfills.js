/**
 * The '#local-polyfills' alias is defined in both Vite config files.
 * Since both files define different resolution paths,
 * they cannot be added to tsconfig and eslint configurations
 */

import {settings} from '#local-polyfills'; // eslint-disable-line import/no-unresolved

import {DEFAULT_SETTINGS} from '../shared/setting-defs';

export async function getSetting(setting) {
  if (await settings.has(setting)) {
    return await settings.get(setting);
  }
  return DEFAULT_SETTINGS[setting];
}

export async function setSetting(setting, value) {
  await settings.set(setting, value);
}

export {
  copyToClipboard,
  i18NextBackend,
  i18NextBackendOptions,
  ipcRenderer,
  openLink,
  setTheme,
} from '#local-polyfills'; // eslint-disable-line import/no-unresolved
