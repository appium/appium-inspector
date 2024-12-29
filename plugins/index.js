import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {BasePlugin} from '@appium/base-plugin';

const PLUGIN_ROOT_PATH = '/inspector';
const INDEX_HTML = 'index.html';
const ROOT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist-browser');

class AppiumInspectorPlugin extends BasePlugin {
  constructor(name, cliArgs) {
    super(name, cliArgs);
  }

  static async openInspector(req, res) {
    const reqPath = req.path === PLUGIN_ROOT_PATH ? INDEX_HTML : req.path.substring(10);
    res.sendFile(reqPath, {root: ROOT_DIR});
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static async updateServer(expressApp, httpServer, cliArgs) {
    // We won't return the inspector contents for `/`
    expressApp.all(/\/inspector.*/, AppiumInspectorPlugin.openInspector);
  }
}

export {AppiumInspectorPlugin};
export default AppiumInspectorPlugin;
