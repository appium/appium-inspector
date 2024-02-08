const browser = {
  clipboard: {
    writeText: (text) => navigator.clipboard.writeText(text),
  },
  shell: {
    openExternal: (url) => window.open(url, ''),
  },
  remote: {
    getCurrentWindow: () => ({
      getSize: () => [window.innerWidth, window.innerHeight],
    }),
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

const log = console;
const settings = new BrowserSettings();
const {clipboard, shell, remote, ipcRenderer} = browser;
const i18NextBackend = require('i18next-chained-backend').default;
const i18NextBackendOptions = {
  backends: [
    require('i18next-localstorage-backend').default,
    require('i18next-http-backend').default,
  ],
  backendOptions: [
    {},
    {
      loadPath: './locales/{{lng}}/{{ns}}.json',
    },
  ],
};

export {
  log,
  settings,
  clipboard,
  shell,
  remote,
  ipcRenderer,
  i18NextBackend,
  i18NextBackendOptions,
};
