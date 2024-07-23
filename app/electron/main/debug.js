import {
  installExtension,
  REACT_DEVELOPER_TOOLS,
  REDUX_DEVTOOLS,
} from 'electron-extension-installer';

export async function installExtensions() {
  const opts = {
    forceDownload: !!process.env.UPGRADE_EXTENSIONS,
    loadExtensionOptions: {
      allowFileAccess: true,
    },
  };
  try {
    await installExtension([REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS], opts);
  } catch (e) {
    console.warn(`Error installing extension: ${e}`); // eslint-disable-line no-console
  }
}
