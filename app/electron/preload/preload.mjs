import {ipcRenderer} from 'electron';

window.electronIPC = {
  hasSetting: async (key) => await ipcRenderer.invoke('settings:has', key),
  setSetting: async (key, val) => await ipcRenderer.invoke('settings:set', key, val),
  getSetting: async (key) => await ipcRenderer.invoke('settings:get', key),
  openLink: (link) => ipcRenderer.send('electron:openLink', link),
  setTheme: (theme) => ipcRenderer.send('electron:setTheme', theme),
  updateLanguage: (lngCode) => ipcRenderer.send('electron:updateLanguage', lngCode),
  loadSessionFileIfOpened: async () => await ipcRenderer.invoke('sessionfile:loadIfOpened'),
  exportPytestFile: async (payload) => await ipcRenderer.invoke('testflow:exportPytestFile', payload),
  runPytestFile: async (payload) => await ipcRenderer.invoke('testflow:runPytestFile', payload),
  onPytestLog: (onLog) => {
    const listener = (_evt, chunk) => onLog(chunk);
    ipcRenderer.on('testflow:pytest-log', listener);
    return () => {
      ipcRenderer.removeListener('testflow:pytest-log', listener);
    };
  },
};

