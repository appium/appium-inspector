import {ipcRenderer} from 'electron';

// Extract the filename argument to allow opening Inspector by opening a session file
const lastArg = process.argv[process.argv.length - 1];
const filenameArg = lastArg.startsWith('filename=') ? lastArg : null;

window.electronIPC = {
  hasSetting: async (key) => await ipcRenderer.invoke('settings:has', key),
  setSetting: async (key, val) => await ipcRenderer.invoke('settings:set', key, val),
  getSetting: async (key) => await ipcRenderer.invoke('settings:get', key),
  openLink: (link) => ipcRenderer.send('electron:openLink', link),
  setTheme: (theme) => ipcRenderer.send('electron:setTheme', theme),
  updateLanguage: (lngCode) => ipcRenderer.send('electron:updateLanguage', lngCode),
  openSessionFile: async (filePath) => await ipcRenderer.invoke('sessionfile:open', filePath),
  filenameArg,
};
