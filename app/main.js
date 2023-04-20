import { app } from 'electron';
import { installExtensions } from '../gui-common/debug';
import { setupMainWindow } from './main/windows';
import { getAppiumSessionFilePath } from './main/helpers';

const isDev = process.env.NODE_ENV === 'development';

if (isDev) {
  require('electron-debug')(); // eslint-disable-line global-require
}

export let openFilePath = getAppiumSessionFilePath(process.argv, app.isPackaged, isDev);

app.on('open-file', (event, filePath) => {
  openFilePath = filePath;
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('ready', async () => {
  await installExtensions();

  setupMainWindow({
    mainUrl: `file://${__dirname}/index.html`,
    splashUrl: `file://${__dirname}/splash.html`,
    isDev,
    shouldShowFileMenu: true,
  });
});
