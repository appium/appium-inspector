/**
 * The '#local-polyfills' alias is defined in both Vite config files
 */

import {settings} from '#local-polyfills';

import {DEFAULT_SETTINGS} from '../shared/setting-defs.js';

export async function getSetting(setting) {
  if (await settings.has(setting)) {
    return await settings.get(setting);
  }
  return DEFAULT_SETTINGS[setting];
}

export async function setSetting(setting, value) {
  await settings.set(setting, value);
}

export {loadSessionFileIfOpened, localesPath, openLink, setTheme, updateLanguage} from '#local-polyfills';
