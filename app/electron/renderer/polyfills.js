// const i18NextBackend = window.electronIPC.i18nextElectronBackend;
import i18NextBackend from 'i18next-electron-fs-backend';
const translationFilePath = window.electronIPC.i18nextFilePath;

const i18NextBackendOptions = {
  loadPath: translationFilePath,
  addPath: translationFilePath,
  contextBridgeApiKey: 'electronIPC',
  jsonIndent: 2,
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
