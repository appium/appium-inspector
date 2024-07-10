import i18NextBackend from 'i18next-chained-backend';
import LocalStorageBackend from 'i18next-localstorage-backend';
import HttpApi from 'i18next-http-backend';

const browser = {
  clipboard: {
    writeText: (text) => navigator.clipboard.writeText(text),
  },
  shell: {
    openExternal: (url) => window.open(url, ''),
  },
  ipcRenderer: {
    on: (evt) => {
      console.warn(`Cannot listen for IPC event ${evt} in browser context`); // eslint-disable-line no-console
    },
  },
  fs: null,
  util: null,
};

class BrowserSettings {
  has(key) {
    return this.get(key) !== null;
  }

  set(key, val) {
    return localStorage.setItem(key, JSON.stringify(val));
  }

  get(key) {
    return JSON.parse(localStorage.getItem(key));
  }

  getSync(key) {
    return this.get(key);
  }
}

const settings = new BrowserSettings();
const {clipboard, shell, ipcRenderer} = browser;
const i18NextBackendOptions = {
  backends: [LocalStorageBackend, HttpApi],
  backendOptions: [
    {},
    {
      loadPath: './{{lng}}/{{ns}}.json',
    },
  ],
};

export {settings, clipboard, shell, ipcRenderer, i18NextBackend, i18NextBackendOptions};
