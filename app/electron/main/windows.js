import {BrowserWindow, Menu, dialog, ipcMain, webContents} from 'electron';
import {join} from 'path';

import settings from '../../common/shared/settings';
import i18n from './i18next';
import {openFilePath} from './main';
import {APPIUM_SESSION_EXTENSION, isDev} from './helpers';
import {rebuildMenus} from './menus';

const mainPath = isDev
  ? process.env.ELECTRON_RENDERER_URL
  : join(__dirname, '../renderer/index.html'); // from 'main' in package.json
const splashPath = isDev
  ? `${process.env.ELECTRON_RENDERER_URL}/splash.html`
  : join(__dirname, '../renderer/splash.html'); // from 'main' in package.json

let mainWindow = null;

function buildSplashWindow() {
  return new BrowserWindow({
    width: 300,
    height: 300,
    minWidth: 300,
    minHeight: 300,
    frame: false,
  });
}

function buildSessionWindow() {
  const window = new BrowserWindow({
    show: false,
    width: 1100,
    height: 710,
    minWidth: 890,
    minHeight: 710,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'), // from 'main' in package.json
      sandbox: false,
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      additionalArguments: openFilePath ? [`filename=${openFilePath}`] : [],
    },
  });

  ipcMain.on('save-file-as', async () => {
    const {canceled, filePath} = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Appium File',
      filters: [{name: 'Appium Session Files', extensions: [APPIUM_SESSION_EXTENSION]}],
    });
    if (!canceled) {
      mainWindow.webContents.send('save-file', filePath);
    }
  });

  return window;
}

export function setupMainWindow() {
  const splashWindow = buildSplashWindow();
  isDev ? splashWindow.loadURL(splashPath) : splashWindow.loadFile(splashPath);
  splashWindow.show();

  mainWindow = buildSessionWindow();
  isDev ? mainWindow.loadURL(mainPath) : mainWindow.loadFile(mainPath);

  mainWindow.webContents.on('did-finish-load', () => {
    splashWindow.destroy();
    mainWindow.show();
    mainWindow.focus();

    if (isDev) {
      mainWindow.openDevTools();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('context-menu', (e, props) => {
    const {x, y} = props;

    Menu.buildFromTemplate([
      {
        label: i18n.t('Inspect element'),
        click() {
          mainWindow.inspectElement(x, y);
        },
      },
    ]).popup(mainWindow);
  });

  i18n.on('languageChanged', async (languageCode) => {
    rebuildMenus(mainWindow);
    await settings.set('PREFERRED_LANGUAGE', languageCode);
    webContents.getAllWebContents().forEach((wc) => {
      wc.send('appium-language-changed', {
        language: languageCode,
      });
    });
  });

  rebuildMenus(mainWindow);
}

export function launchNewSessionWindow() {
  const win = buildSessionWindow();
  isDev ? win.loadURL(mainPath) : win.loadFile(mainPath);
  win.show();
}
