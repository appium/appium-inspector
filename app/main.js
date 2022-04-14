import i18n from './configs/i18next.config';
import { app, BrowserWindow, Menu, webContents } from 'electron';
import { installExtensions } from '../gui-common/debug';
import { setupMainWindow } from '../gui-common/windows';
import { rebuildMenus } from './main/menus';
import settings from './shared/settings';
import { getAppiumFilePath } from './main/helpers';

let mainWindow = null;
const isDev = process.env.NODE_ENV === 'development';

if (isDev) {
  require('electron-debug')(); // eslint-disable-line global-require
}

let openFilePath = getAppiumFilePath(process.argv, app.isPackaged, isDev);
if (!openFilePath) {
  app.on('open-file', (event, filePath) => {
    openFilePath = filePath;
  });
}

// TODO: Do not merge this to master, for testing only
/*const filePath = '/Users/danielgraham/appium-inspector/test/fixtures/sample.appium';
try {
  appiumFileJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  fileOpenSuccess = true;
} catch (e) {
  console.error(e);
  console.error(`Error parsing ${filePath}`);
  fileOpenSuccess = false;
  fileOpenMessage = `Could not open file ${filePath} ${e}`;
}*/

app.on('window-all-closed', () => {
  app.quit();
});

app.on('ready', async () => {
  await installExtensions();

  mainWindow = new BrowserWindow({
    show: false,
    width: 1280,
    height: 800,
    minWidth: 1000,
    minHeight: 800,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      additionalArguments: openFilePath ? [`filename=${openFilePath}`] : [],
    },
  });

  const splashWindow = new BrowserWindow({
    width: 300,
    height: 300,
    minWidth: 300,
    minHeight: 300,
    frame: false,
  });

  setupMainWindow({
    mainWindow,
    splashWindow,
    mainUrl: `file://${__dirname}/index.html`,
    splashUrl: `file://${__dirname}/splash.html`,
    isDev,
    Menu,
    i18n,
    rebuildMenus,
    settings,
    webContents
  });
});
