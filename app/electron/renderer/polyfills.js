import {ipcRenderer} from 'electron';
import i18NextBackend from 'i18next-fs-backend';
import {join} from 'path';

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
  copyToClipboard: (text) => ipcRenderer.send('electron:copyToClipboard', text),
  openLink: (link) => ipcRenderer.send('electron:openLink', link),
};

class ElectronSettings {
  async has(key) {
    return await ipcRenderer.invoke('settings:has', key);
  }

  async set(key, val) {
    return await ipcRenderer.invoke('settings:set', key, val);
  }

  async get(key) {
    return await ipcRenderer.invoke('settings:get', key);
  }
}

const settings = new ElectronSettings();
const {copyToClipboard, openLink} = electronUtils;

export {copyToClipboard, i18NextBackend, i18NextBackendOptions, ipcRenderer, openLink, settings};
