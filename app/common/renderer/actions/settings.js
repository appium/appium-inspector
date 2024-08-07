import {DEFAULT_SETTINGS} from '../../shared/setting-defs';
import {settings} from '../polyfills';

export async function getSetting(setting) {
  if (await settings.has(setting)) {
    return await settings.get(setting);
  }
  return DEFAULT_SETTINGS[setting];
}

export async function setSetting(setting, value) {
  await settings.set(setting, value);
}
