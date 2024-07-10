import {app} from 'electron';

// import {installExtensions} from './debug';
import {getAppiumSessionFilePath} from './helpers';
import {setupMainWindow} from './windows';

const isDev = process.env.NODE_ENV === 'development';

export let openFilePath = getAppiumSessionFilePath(process.argv, app.isPackaged, isDev);

app.on('open-file', (event, filePath) => {
  openFilePath = filePath;
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('ready', () => {
  if (isDev) {
    require('electron-debug')();
    // TODO: uncomment this after upgrading to newer Electron
    // await installExtensions();
  }

  setupMainWindow({
    mainUrl: `file://${__dirname}/index.html`,
    splashUrl: `file://${__dirname}/splash.html`,
    isDev,
  });
});
