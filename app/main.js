import {app} from 'electron';

import {installExtensions} from './main/debug';
import {getAppiumSessionFilePath} from './main/helpers';
import {setupMainWindow} from './main/windows';

const isDev = process.env.NODE_ENV === 'development';

export let openFilePath = getAppiumSessionFilePath(process.argv, app.isPackaged, isDev);

app.on('open-file', (event, filePath) => {
  openFilePath = filePath;
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('ready', async () => {
  if (isDev) {
    require('electron-debug')();
    await installExtensions();
  }

  setupMainWindow({
    mainUrl: `file://${__dirname}/index.html`,
    splashUrl: `file://${__dirname}/splash.html`,
    isDev,
  });
});
