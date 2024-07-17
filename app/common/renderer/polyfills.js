let settings, clipboard, shell, ipcRenderer, i18NextBackend, i18NextBackendOptions, fs, util;

function buildForBrowser() {
  if (process.env.BUILD_BROWSER) {
    return true;
  }

  if (typeof navigator !== 'undefined' && !/electron/i.test(navigator.userAgent)) {
    return true;
  }

  return false;
}

if (buildForBrowser()) {
  ({
    settings,
    clipboard,
    shell,
    ipcRenderer,
    i18NextBackend,
    i18NextBackendOptions,
    fs,
    util,
  } = require('../../web/polyfills'));
} else {
  ({
    settings,
    clipboard,
    shell,
    ipcRenderer,
    i18NextBackend,
    i18NextBackendOptions,
    fs,
    util,
  } = require('../../electron/renderer/polyfills'));
}

export {settings, clipboard, shell, ipcRenderer, i18NextBackend, i18NextBackendOptions, fs, util};
