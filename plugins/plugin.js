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
    if (req.path === '/inspector') {
      res.sendFile('index.html', { root: "/Users/kazu/github/appium-inspector/dist-browser" });
    } else {
      res.sendFile(req.path, { root: "/Users/kazu/github/appium-inspector/dist-browser" });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars,require-await
  static async updateServer(expressApp, httpServer, cliArgs) {
    expressApp.all(/\/inspector.*/, AppiumInspectorPlugin.openInspector);
    expressApp.all(/\/assets\/.*/, AppiumInspectorPlugin.openInspector);
    expressApp.all(/\/locales\/.*/, AppiumInspectorPlugin.openInspector);
  }
}

export {AppiumInspectorPlugin};
export default AppiumInspectorPlugin;