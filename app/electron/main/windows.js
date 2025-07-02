import {BrowserWindow, Menu, nativeTheme, webContents} from 'electron';
import settings from 'electron-settings';
import {join} from 'path';

import {PREFERRED_LANGUAGE, PREFERRED_THEME} from '../../common/shared/setting-defs';
import {isDev} from './helpers';
import i18n from './i18next';
import {openFilePath} from './main';
import {rebuildMenus} from './menus';

const mainPath = isDev
  ? process.env.ELECTRON_RENDERER_URL
  : join(__dirname, '..', 'renderer', 'index.html'); // from 'main' in package.json
const splashPath = isDev
  ? `${process.env.ELECTRON_RENDERER_URL}/splash.html`
  : join(__dirname, '..', 'renderer', 'splash.html'); // from 'main' in package.json
const pathLoadMethod = isDev ? 'loadURL' : 'loadFile';

let mainWindow = null;

function buildSplashWindow(backgroundColor) {
  return new BrowserWindow({
    width: 300,
    height: 300,
    minWidth: 300,
    minHeight: 300,
    frame: false,
    backgroundColor,
    webPreferences: {
      devTools: false,
    },
  });
}

function buildSessionWindow(backgroundColor) {
  return new BrowserWindow({
    show: false,
    width: 1100,
    height: 710,
    minWidth: 890,
    minHeight: 710,
    titleBarStyle: 'hiddenInset',
    backgroundColor,
    webPreferences: {
      preload: join(__dirname, '..', 'preload', 'preload.mjs'), // from 'main' in package.json
      sandbox: false,
      nodeIntegration: true,
      contextIsolation: false,
      additionalArguments: openFilePath ? [`filename=${openFilePath}`] : [],
    },
  });
}

export async function setupMainWindow() {
  const preferredTheme = await settings.get(PREFERRED_THEME);
  const isDarkTheme =
    preferredTheme === 'dark' || (preferredTheme === 'system' && nativeTheme.shouldUseDarkColors);
  const backgroundColor = isDarkTheme ? '#191919' : '#f5f5f5';

  const splashWindow = buildSplashWindow(backgroundColor);
  splashWindow[pathLoadMethod](splashPath);
  splashWindow.show();

  mainWindow = buildSessionWindow(backgroundColor);
  mainWindow[pathLoadMethod](mainPath);

  mainWindow.webContents.on('did-finish-load', () => {
    rebuildMenus(mainWindow);
    splashWindow.destroy();
    mainWindow.show();
    mainWindow.focus();
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

  // Override the 'content-type' header to allow connecting to Selenium Grid devices
  // eslint-disable-next-line promise/prefer-await-to-callbacks
  mainWindow.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['content-type'] = 'application/json; charset=utf-8';
    // eslint-disable-next-line promise/prefer-await-to-callbacks
    callback({requestHeaders: details.requestHeaders});
  });

  i18n.on('languageChanged', async (languageCode) => {
    // this event gets called before the i18n initialization event,
    // so add a guard condition
    if (!i18n.isInitialized) {
      return;
    }
    rebuildMenus(mainWindow);
    await settings.set(PREFERRED_LANGUAGE, languageCode);
    webContents.getAllWebContents().forEach((wc) => {
      wc.send('appium-language-changed', {
        language: languageCode,
      });
    });
  });
}

export function launchNewSessionWindow() {
  const win = buildSessionWindow();
  win[pathLoadMethod](mainPath);
  win.show();
}
