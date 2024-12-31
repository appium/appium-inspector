import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {BasePlugin} from '@appium/base-plugin';
const PLUGIN_ROOT_PATH = '/inspector';
const INDEX_HTML = 'index.html';
const ROOT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist-browser');

/**
 * Appium Inspector Plugin class
 * @extends {BasePlugin}
 */
class AppiumInspectorPlugin extends BasePlugin {
  /**
   * Creates an instance of AppiumInspectorPlugin
   * @param {string} name - The name of the plugin
   * @param {Record<string, unknown>} cliArgs - Command line arguments
   */
  constructor(name, cliArgs) {
    super(name, cliArgs);
  }

  /**
   * Handles inspector page requests
   * @param {import('express').Request} req - Express request object
   * @param {import('express').Response} res - Express response object
   * @returns {Promise<void>}
   */
  static async openInspector(req, res) {
    const reqPath = req.path === PLUGIN_ROOT_PATH ? INDEX_HTML : req.path.substring(10);
    res.sendFile(reqPath, {root: ROOT_DIR});
  }

  /**
   * Updates the Express server configuration
   * @param {import('express').Application} expressApp - Express application instance
   * @param {import('http').Server} httpServer - HTTP server instance
   * @param {Record<string, unknown>} cliArgs - Command line arguments
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static async updateServer(expressApp, httpServer, cliArgs) {
    // Handle both /inspector and /inspector/* paths
    expressApp.all(['/inspector', '/inspector/*'], AppiumInspectorPlugin.openInspector);
  }
}

export {AppiumInspectorPlugin};
export default AppiumInspectorPlugin;
