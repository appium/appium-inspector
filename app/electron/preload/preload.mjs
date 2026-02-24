// const {join} = require('node:path');

const {contextBridge, ipcRenderer} = require('electron');

// const i18nLocalesPath =
//   process.env.NODE_ENV === 'development'
//     ? join('app', 'common', 'public', 'locales') // from project root
//     : join(__dirname, '..', 'renderer', 'locales'); // from 'main' in package.json
// const i18nTranslationFilePath = join(i18nLocalesPath, '{{lng}}', '{{ns}}.json');

// Extract the filename argument from process.argv (passed via additionalArguments)
const filenameArg = process.argv.find((arg) => arg.startsWith('filename='));

contextBridge.exposeInMainWorld('electronIPC', {
  hasSetting: async (key) => await ipcRenderer.invoke('settings:has', key),
  setSetting: async (key, val) => await ipcRenderer.invoke('settings:set', key, val),
  getSetting: async (key) => await ipcRenderer.invoke('settings:get', key),
  openLink: (link) => ipcRenderer.send('electron:openLink', link),
  setTheme: (theme) => ipcRenderer.send('electron:setTheme', theme),
  updateLanguage: (lngCode) => ipcRenderer.send('electron:updateLanguage', lngCode),
  openSessionFile: async (filePath) => await ipcRenderer.invoke('sessionfile:open', filePath),
  // i18nextFilePath: i18nTranslationFilePath,
  filenameArg,
});
