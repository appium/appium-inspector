import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

import {BasePlugin} from '@appium/base-plugin';
import express from 'express';
import path from 'path';

const PLUGIN_ROOT_PATH = '/inspector';
const INDEX_HTML = 'index.html';
const DIST_DIR = 'dist-browser';

class AppiumInspectorPlugin extends BasePlugin {
  constructor(name, cliArgs) {
    super(name, cliArgs);
  }

  static async openInspector(req, res) {
    const reqPath = req.path === PLUGIN_ROOT_PATH ? INDEX_HTML : req.path.substring(10);
    res.sendFile(reqPath, {root: `${dirname(fileURLToPath(import.meta.url))}/${DIST_DIR}`});
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static async updateServer(expressApp, httpServer, cliArgs) {
    const staticFilesRouter = express.Router();
    const PUBLIC_DICRECTORY = getPublicDirectory();
    staticFilesRouter.use(express.static(PUBLIC_DICRECTORY));
    expressApp.use(staticFilesRouter);
    expressApp.all(/\/inspector.*/, AppiumInspectorPlugin.openInspector);
  }
}

function getPublicDirectory() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  return path.join(__dirname, DIST_DIR);
}

export {AppiumInspectorPlugin};
export default AppiumInspectorPlugin;
