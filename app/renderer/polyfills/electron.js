import path from 'path';
import { clipboard, shell, remote, ipcRenderer } from 'electron';
import log from 'electron-log';
import settings from 'electron-settings';
import i18NextBackend from 'i18next-node-fs-backend';
import fs from 'fs';
const i18NextBackendOptions = {
  loadPath: path.join(__dirname, 'locales/{{lng}}/{{ns}}.json'),
  addPath: path.join(__dirname, 'locales/{{lng}}/{{ns}}.json'),
  jsonIndent: 2,
};

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
};
