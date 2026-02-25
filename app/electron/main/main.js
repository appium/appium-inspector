import {app} from 'electron';
import debug from 'electron-debug';

import {installExtensions} from './debug.js';
import {isDev, setupIPCListeners} from './helpers.js';
import {setupMainWindow} from './windows.js';

// Used when opening Inspector through an .appiumsession file (Windows/Linux).
// This value is not set in dev mode, since accessing argv[1] there throws an error,
// and this flow only makes sense for the installed Inspector app anyway
let openFilePath = process.platform === 'darwin' || isDev ? null : process.argv[1];

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

  setupIPCListeners(() => openFilePath);
  await setupMainWindow();
});
