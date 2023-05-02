import path from 'path';
import { clipboard, shell, remote, ipcRenderer } from 'electron';
import log from 'electron-log';
import {default as electronSettings} from 'electron-settings';
import i18NextBackend from 'i18next-node-fs-backend';
import fs from 'fs';
import util from 'util';
const i18NextBackendOptions = {
  loadPath: path.join(__dirname, 'locales/{{lng}}/{{ns}}.json'),
  addPath: path.join(__dirname, 'locales/{{lng}}/{{ns}}.json'),
  jsonIndent: 2,
};

class ElectronSettings {
  async has (key) {
    return await ipcRenderer.invoke('has-setting', key);
  }

  async get (key) {
    return await ipcRenderer.invoke('get-setting', key);
  }

  getSync (key) {
    return electronSettings.getSync(key);
  }

  set (key, val) {
    ipcRenderer.send('set-setting', key, val);
  }
}

const settings = new ElectronSettings();

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
