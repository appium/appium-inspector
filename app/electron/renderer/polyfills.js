import {clipboard, ipcRenderer, shell} from 'electron';
import settings from 'electron-settings';
import fs from 'fs';
import i18NextBackend from 'i18next-fs-backend';
import {join} from 'path';
import util from 'util';

const localesPath =
  process.env.NODE_ENV === 'development'
    ? 'app/common/public/locales' // from project root
    : join(__dirname, '../renderer/locales'); // from 'main' in package.json

const i18NextBackendOptions = {
  loadPath: `${localesPath}/{{lng}}/{{ns}}.json`,
  addPath: `${localesPath}/{{lng}}/{{ns}}.json`,
  jsonIndent: 2,
};

export {settings, clipboard, shell, ipcRenderer, i18NextBackend, i18NextBackendOptions, fs, util};
