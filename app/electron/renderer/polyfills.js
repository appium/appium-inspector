import {clipboard, ipcRenderer, shell} from 'electron';
import settings from 'electron-settings';
import fs from 'fs';
import i18NextBackend from 'i18next-fs-backend';
import path from 'path';
import util from 'util';

const i18NextBackendOptions = {
  loadPath: path.join(__dirname, '{{lng}}/{{ns}}.json'),
  addPath: path.join(__dirname, '{{lng}}/{{ns}}.json'),
  jsonIndent: 2,
};

export {settings, clipboard, shell, ipcRenderer, i18NextBackend, i18NextBackendOptions, fs, util};
