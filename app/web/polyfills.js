import i18NextBackend from 'i18next-chained-backend';
import LocalStorageBackend from 'i18next-localstorage-backend';
import HttpApi from 'i18next-http-backend';

const localesPath =
  process.env.NODE_ENV === 'development'
    ? '/locales' // 'public' folder contents are served at '/'
    : '../locales'; // from 'dist-browser/assets/'

const browserUtils = {
  copyToClipboard: (text) => navigator.clipboard.writeText(text),
  openLink: (url) => window.open(url, ''),
  ipcRenderer: {
    on: (evt) => {
      console.warn(`Cannot listen for IPC event ${evt} in browser context`); // eslint-disable-line no-console
    },
  },
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
const {copyToClipboard, openLink, ipcRenderer} = browserUtils;
const i18NextBackendOptions = {
  backends: [LocalStorageBackend, HttpApi],
  backendOptions: [
    {},
    {
      loadPath: `${localesPath}/{{lng}}/{{ns}}.json`,
    },
  ],
};

export {settings, copyToClipboard, openLink, ipcRenderer, i18NextBackend, i18NextBackendOptions};
