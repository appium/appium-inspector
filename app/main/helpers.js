import { ipcMain } from 'electron';
import settings from 'electron-settings';

const APPIUM_SESSION_FILE_VERSION = '1.0';

export function setupIPCListeners () {
  ipcMain.handle('has-setting', (_evt, key) => settings.has(key));
  ipcMain.handle('get-setting', (_evt, key) => settings.get(key));
}

export function getAppiumSessionFilePath (argv, isPackaged, isDev) {
  if (isDev) {
    // do not use file launcher in dev mode because argv is different
    // then it is in production
    return false;
  }
  if (process.platform === 'darwin' && !isDev) {
    // packaged macOS apps do not receive args from process.argv, they
    // receive the filepath argument from the `electron.app.on('open-file', cb)` event
    return false;
  }
  const argvIndex = isPackaged ? 1 : 2;
  return argv[argvIndex];
}

// get the slice of the redux state that's needed for the .appiumsession files
export function getSaveableState (reduxState) {
  return {
    version: APPIUM_SESSION_FILE_VERSION,
    caps: reduxState.caps,
    server: reduxState.server,
    serverType: reduxState.serverType,
    visibleProviders: reduxState.visibleProviders,
  };
}

export const APPIUM_SESSION_EXTENSION = 'appiumsession';
