import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import {BasePlugin} from 'appium/plugin.js';

class AppiumInspectorPlugin extends BasePlugin {
  constructor(name, cliArgs) {
    super(name, cliArgs);
  }

  static async openInspector(req, res) {
    // move 'dist-browser' into this directory and publish it.
    // Then, 'appium plugin install --source=local /Users/kazu/github/appium-inspector/plugins' or local
    const reqPath = req.path === '/inspector' ? 'index.html' : req.path.substring(10);
    res.sendFile(reqPath, { root: `${dirname(fileURLToPath(import.meta.url))}/dist-browser` });
  }

  static async updateServer(expressApp, httpServer, cliArgs) {
    expressApp.all(/\/inspector.*/, AppiumInspectorPlugin.openInspector);
  }
}

export {AppiumInspectorPlugin};
export default AppiumInspectorPlugin;
