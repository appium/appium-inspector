const localesPath = './locales'; // relative path works for both dev and production

const openLink = (link) => window.electronIPC.openLink(link);
const setTheme = (theme) => window.electronIPC.setTheme(theme);
const updateLanguage = (lngCode) => window.electronIPC.updateLanguage(lngCode);
const loadSessionFileIfOpened = () => window.electronIPC.loadSessionFileIfOpened();

class ElectronSettings {
  async has(key) {
    return await window.electronIPC.hasSetting(key);
  }

  async set(key, val) {
    return await window.electronIPC.setSetting(key, val);
  }

  async get(key) {
    return await window.electronIPC.getSetting(key);
  }
}

const settings = new ElectronSettings();

export {loadSessionFileIfOpened, localesPath, openLink, setTheme, settings, updateLanguage};
