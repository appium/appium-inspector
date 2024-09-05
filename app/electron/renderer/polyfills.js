import {ipcRenderer} from 'electron';
import settings from 'electron-settings';
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

const {copyToClipboard, openLink} = electronUtils;

export {settings, copyToClipboard, openLink, ipcRenderer, i18NextBackend, i18NextBackendOptions};
