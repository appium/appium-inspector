import {clipboard, ipcMain, nativeTheme, shell} from 'electron';
import settings from 'electron-settings';
import fs from 'fs';

import i18n from './i18next';

export const isDev = process.env.NODE_ENV === 'development';

export function setupIPCListeners() {
  ipcMain.handle('settings:has', async (_evt, key) => await settings.has(key));
  ipcMain.handle('settings:set', async (_evt, key, value) => await settings.set(key, value));
  ipcMain.handle('settings:get', async (_evt, key) => await settings.get(key));
  ipcMain.on('electron:openLink', (_evt, link) => shell.openExternal(link));
  ipcMain.on('electron:copyToClipboard', (_evt, text) => clipboard.writeText(text));
  ipcMain.on('electron:setTheme', (_evt, theme) => (nativeTheme.themeSource = theme));
  ipcMain.handle('sessionfile:open', async (_evt, filePath) => openSessionFile(filePath));
}

// Open an .appiumsession file from the specified path and return its contents
export const openSessionFile = (filePath) => fs.readFileSync(filePath, 'utf8');

export const t = (string, params = null) => i18n.t(string, params);

export const APPIUM_SESSION_EXTENSION = 'appiumsession';
