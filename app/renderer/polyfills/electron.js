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
  has (key) {
    return electronSettings.has(key);
  }

  get (key) {
    return electronSettings.get(key);
  }

  getSync (key) {
    return electronSettings.getSync(key);
  }

  set (key, val) {
    electronSettings.set(key, val);
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
