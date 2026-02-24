import {join} from 'node:path';

import i18NextBackend from 'i18next-fs-backend';

const localesPath =
  process.env.NODE_ENV === 'development'
    ? join('app', 'common', 'public', 'locales') // from project root
    : join(__dirname, '..', 'renderer', 'locales'); // from 'main' in package.json
const translationFilePath = join(localesPath, '{{lng}}', '{{ns}}.json');

const i18NextBackendOptions = {
  loadPath: translationFilePath,
  addPath: translationFilePath,
  jsonIndent: 2,
};

const electronUtils = {
  openLink: (link) => window.electronIPC.openLink(link),
  setTheme: (theme) => window.electronIPC.setTheme(theme),
  updateLanguage: (lngCode) => window.electronIPC.updateLanguage(lngCode),
};

class ElectronSettings {
  async has(key) {
    return await window.electronIPC.hasSetting(key);
  }

  async set(key, val) {
    return await window.electronIPC.setSetting(key, val);
  }

  async get(key) {
    return await window.electronIPC.getSetting(key);
  }
}

const settings = new ElectronSettings();
const {openLink, setTheme, updateLanguage} = electronUtils;

export {i18NextBackend, i18NextBackendOptions, openLink, setTheme, settings, updateLanguage};
