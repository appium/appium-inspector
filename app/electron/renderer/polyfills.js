import i18NextBackend from 'i18next-chained-backend';
import HttpApi from 'i18next-http-backend';
import LocalStorageBackend from 'i18next-localstorage-backend';

const localesPath = './locales'; // relative path works for both dev and production

const i18NextBackendOptions = {
  backends: [LocalStorageBackend, HttpApi],
  backendOptions: [
    {},
    {
      loadPath: `${localesPath}/{{lng}}/{{ns}}.json`,
    },
  ],
};

const openLink = (link) => window.electronIPC.openLink(link);
const setTheme = (theme) => window.electronIPC.setTheme(theme);
const updateLanguage = (lngCode) => window.electronIPC.updateLanguage(lngCode);

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

export {i18NextBackend, i18NextBackendOptions, openLink, setTheme, settings, updateLanguage};
