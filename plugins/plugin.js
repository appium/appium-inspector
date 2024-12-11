// @ts-check
/* eslint-disable no-case-declarations */

import _ from 'lodash';
import {promises as fs} from 'fs';
import {BasePlugin} from 'appium/plugin.js';

class AppiumInspectorPlugin extends BasePlugin {
  constructor(name, cliArgs) {
    super(name, cliArgs);
  }

  static async openInspector(req, res) {
    const reqPath = req.path === '/inspector' ? 'index.html' : req.path.substring(10);
    res.sendFile(reqPath, { root: "/Users/kazu/github/appium-inspector/dist-browser" });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars,require-await
  static async updateServer(expressApp, httpServer, cliArgs) {
    expressApp.all(/\/inspector.*/, AppiumInspectorPlugin.openInspector);
  }
}

export {AppiumInspectorPlugin};
export default AppiumInspectorPlugin;