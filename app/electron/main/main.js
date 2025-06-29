import {app} from 'electron';
import debug from 'electron-debug';

import {installExtensions} from './debug';
import {isDev, setupIPCListeners} from './helpers';
import {setupMainWindow} from './windows';

// Used when opening Inspector through an .appiumsession file (Windows/Linux).
// This value is not set in dev mode, since accessing argv[1] there throws an error,
// and this flow only makes sense for the installed Inspector app anyway
export let openFilePath = process.platform === 'darwin' || isDev ? null : process.argv[1];

// Used when opening Inspector through an .appiumsession file (macOS)
app.on('open-file', (event, filePath) => {
  event.preventDefault();
  openFilePath = filePath;
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('ready', async () => {
  if (isDev) {
    debug();
    await installExtensions();
  }

  setupIPCListeners();
  await setupMainWindow();
});
