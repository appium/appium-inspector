import i18NextBackend from 'i18next-chained-backend';
import HttpApi from 'i18next-http-backend';
import LocalStorageBackend from 'i18next-localstorage-backend';

const localesPath =
  process.env.NODE_ENV === 'development'
    ? '/locales' // 'public' folder contents are served at '/'
    : '../locales'; // from 'dist-browser/assets/'

const i18NextBackendOptions = {
  backends: [LocalStorageBackend, HttpApi],
  backendOptions: [
    {},
    {
      loadPath: `${localesPath}/{{lng}}/{{ns}}.json`,
    },
  ],
};

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
    // Appium Inspector tries to access previous connection details from localstorage and pre-fill.
    // But, block it, as we pre-fill the current session details.
    return false;
  }

  set(key, val) {
    return localStorage.setItem(key, JSON.stringify(val));
  }

  get(key) {
    return JSON.parse(localStorage.getItem(key));
  }
}

const settings = new BrowserSettings();
const {copyToClipboard, openLink, ipcRenderer} = browserUtils;

export {copyToClipboard, i18NextBackend, i18NextBackendOptions, ipcRenderer, openLink, settings};
