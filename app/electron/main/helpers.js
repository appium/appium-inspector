import i18n from './i18next';

export function getAppiumSessionFilePath(argv, isPackaged, isDev) {
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

export const t = (string, params = null) => i18n.t(string, params);

export const APPIUM_SESSION_EXTENSION = 'appiumsession';
