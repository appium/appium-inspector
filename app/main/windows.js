import { BrowserWindow, dialog, ipcMain, Menu, webContents } from 'electron';
import { APPIUM_SESSION_EXTENSION } from './helpers';
import { rebuildMenus } from './menus';
import { openFilePath } from '../main';
import i18n from '../configs/i18next.config';

let mainWindow = null;

function buildSplashWindow () {
  return new BrowserWindow({
    width: 300,
    height: 300,
    minWidth: 300,
    minHeight: 300,
    frame: false,
  });
}

function buildSessionWindow () {
  const window = new BrowserWindow({
    show: false,
    width: 1280,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      additionalArguments: openFilePath ? [`filename=${openFilePath}`] : [],
    },
  });

  ipcMain.on('save-file-as', async () => {
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Appium File',
      filters: [
        {name: 'Appium Session Files', extensions: [APPIUM_SESSION_EXTENSION]},
      ]
    });
    if (!canceled) {
      mainWindow.webContents.send('save-file', filePath);
    }
  });

  return window;
}

export function setupMainWindow ({splashUrl, mainUrl, isDev, shouldShowFileMenu = false}) {
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

    Menu.buildFromTemplate([{
      label: i18n.t('Inspect element'),
      click () {
        mainWindow.inspectElement(x, y);
      }
    }]).popup(mainWindow);
  });

  i18n.on('languageChanged', (languageCode) => {
    rebuildMenus(null, shouldShowFileMenu);
    webContents.getAllWebContents().forEach((wc) => {
      wc.send('appium-language-changed', {
        language: languageCode,
      });
    });
  });

  rebuildMenus(mainWindow, shouldShowFileMenu);
}

export function launchNewSessionWindow () {
  const url = `file://${__dirname}/index.html`;
  const win = buildSessionWindow();
  win.loadURL(url);
  win.show();
}
