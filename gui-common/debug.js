const isDev = process.env.NODE_ENV === 'development';

export async function installExtensions () {
  if (isDev) {
    const installer = require('electron-devtools-installer'); // eslint-disable-line global-require
    const { app } = require('electron');
    const { REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS } = installer;
    const opts = {
      forceDownload: !!process.env.UPGRADE_EXTENSIONS,
      loadExtensionOptions: {
        allowFileAccess: true
      }
    };
    await app.whenReady();
    try {
      await installer.default([REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS], opts);
    } catch (e) {
      console.warn(`Error installing extension: ${e}`);
    }
  }
}
