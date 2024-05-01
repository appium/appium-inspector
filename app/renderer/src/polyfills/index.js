let log,
  settings,
  clipboard,
  shell,
  remote,
  ipcRenderer,
  i18NextBackend,
  i18NextBackendOptions,
  fs,
  util;

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
    log,
    settings,
    clipboard,
    shell,
    remote,
    ipcRenderer,
    i18NextBackend,
    i18NextBackendOptions,
    fs,
    util,
  } = require('./browser'));
} else {
  ({
    log,
    settings,
    clipboard,
    shell,
    remote,
    ipcRenderer,
    i18NextBackend,
    i18NextBackendOptions,
    fs,
    util,
  } = require('./electron'));
}

export {
  log,
  clipboard,
  shell,
  remote,
  ipcRenderer,
  settings,
  i18NextBackend,
  i18NextBackendOptions,
  fs,
  util,
};
