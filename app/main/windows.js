import {BrowserWindow, Menu, dialog, ipcMain, webContents} from 'electron';

import i18n from '../configs/i18next.config';
import {openFilePath} from '../main';
import settings from '../shared/settings';
import {APPIUM_SESSION_EXTENSION} from './helpers';
import {rebuildMenus} from './menus';

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

export function setupMainWindow({splashUrl, mainUrl, isDev}) {
  const splashWindow = buildSplashWindow();
  mainWindow = buildSessionWindow();

  splashWindow.loadURL(splashUrl);
  splashWindow.show();

  mainWindow.loadURL(mainUrl);

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
    rebuildMenus(mainWindow, isDev);
    await settings.set('PREFERRED_LANGUAGE', languageCode);
    webContents.getAllWebContents().forEach((wc) => {
      wc.send('appium-language-changed', {
        language: languageCode,
      });
    });
  });

  rebuildMenus(mainWindow, isDev);
}

export function launchNewSessionWindow() {
  const url = `file://${__dirname}/index.html`;
  const win = buildSessionWindow();
  win.loadURL(url);
  win.show();
}
