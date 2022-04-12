import {BrowserWindow, Menu} from 'electron';
import fs from 'fs';
import settings from '../shared/settings';
import i18n from '../configs/i18next.config';
import { makeOpenBrowserWindow, makeSetSavedEnv } from '../../gui-common/util';

export function openBrowserWindow (route, opts) {
  const open = makeOpenBrowserWindow({BrowserWindow, Menu, i18n});
  return open(route, opts);
}

export function setSavedEnv () {
  const set = makeSetSavedEnv(settings);
  return set();
}

export function readAppiumFile (argv, isPackaged, isDev) {
  if (process.platform === 'darwin') {
    return {success: false};
  }
  let argvIndex = isPackaged ? 1 : (isDev ? 3 : 2);
  const appiumFilePath = argv[argvIndex];
  if (!fs.existsSync(appiumFilePath)) {
    return {success: false, message: `Appium file not found at ${appiumFilePath}`};
  }
  if (appiumFilePath) {
    try {
      const appiumFile = fs.readFileSync(appiumFilePath, 'utf8');
      const appiumFileJson = JSON.parse(appiumFile); // TODO: Use JSONC?
      return {success: true, appiumFileJson};
    } catch (e) { }
    return {success: false, appiumFilePath};
  }
  return {success: false};
}

