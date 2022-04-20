import {BrowserWindow, Menu} from 'electron';
import settings from '../shared/settings';
import i18n from '../configs/i18next.config';
import { makeOpenBrowserWindow, makeSetSavedEnv } from '../../gui-common/util';

export function openBrowserWindow (route, opts) {
  const open = makeOpenBrowserWindow({BrowserWindow, Menu, i18n});
  return open(route, opts);
}

export function setSavedEnv () {
  const set = makeSetSavedEnv(settings);
  return set();
}

export function getAppiumFilePath (argv, isPackaged, isDev) {
  if (process.platform === 'darwin' && !isDev) {
    // packaged macOS apps do not receive args from process.argv, they
    // receive the filepath argument from the `electron.app.on('open-file', cb)` event
    return false;
  }
  let argvIndex = isPackaged ? 1 : 2;
  return argv[argvIndex];
}

export function getSaveableState (reduxState) {
  return {
    caps: reduxState.caps,
    server: reduxState.server,
    serverType: reduxState.serverType,
    visibleProviders: reduxState.visibleProviders,
  }
}
