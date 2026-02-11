import {join} from 'node:path';

import {
  installExtension,
  REACT_DEVELOPER_TOOLS,
  REDUX_DEVTOOLS,
} from '@tomjs/electron-devtools-installer';

const EXTENSIONS_TO_INSTALL = [REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS];

// These console.log wrappers are used for better visual separation from other logs

function logEmptyLine() {
  console.log(''); // eslint-disable-line no-console
}

function logWithExtPrefix(textString) {
  console.log(`[🧩 Extensions 🧩] ${textString}`); // eslint-disable-line no-console
}

export async function installExtensions() {
  const opts = {
    forceDownload: !!process.env.UPGRADE_EXTENSIONS,
  };
  logEmptyLine();
  logWithExtPrefix('Installing development extensions...');
  logWithExtPrefix(
    opts.forceDownload
      ? 'Explicitly re-downloading all extensions'
      : 'Set UPGRADE_EXTENSIONS=1 to force re-download',
  );
  try {
    const installedExts = await installExtension(EXTENSIONS_TO_INSTALL, opts);
    if (installedExts.length === 0) {
      logWithExtPrefix('No extensions were installed');
    } else {
      logWithExtPrefix(`Installed extensions at ${join(installedExts[0].path, '..')}:`);
      for (const ext of installedExts) {
        logWithExtPrefix(`* ${ext.name} v${ext.version} (ID: ${ext.id})`);
      }
    }
  } catch (e) {
    logWithExtPrefix(`Error installing extensions: ${e}`);
  }
  logEmptyLine();
}
