export async function installExtensions () {
  const installer = require('electron-devtools-installer');
  const { REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS } = installer;
  const opts = {
    forceDownload: !!process.env.UPGRADE_EXTENSIONS,
    loadExtensionOptions: {
      allowFileAccess: true
    }
  };
  try {
    await installer.default([REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS], opts);
  } catch (e) {
    console.warn(`Error installing extension: ${e}`); // eslint-disable-line no-console
  }
}
