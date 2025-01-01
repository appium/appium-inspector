import path from 'node:path';
import {fileURLToPath} from 'node:url';

import fs from 'fs/promises';

const ROOT_PKG_JSON_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'package.json',
);
const PLUGIN_PKG_JSON_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'plugins',
  'package.json',
);

/**
 * Return JSON parsed contents from the given path.
 * @param {string} path
 * @returns {Promise<object>}
 */
async function readJsonContent(jsonPath) {
  return await JSON.parse(await fs.readFile(jsonPath, 'utf8'));
}

async function main() {
  const rootJsonContent = await readJsonContent(ROOT_PKG_JSON_PATH);
  const pluginJsonContent = await readJsonContent(PLUGIN_PKG_JSON_PATH);
  pluginJsonContent.version = rootJsonContent.version;
  await fs.writeFile(PLUGIN_PKG_JSON_PATH, JSON.stringify(pluginJsonContent, null, 2), 'utf8');
}

(async () => await main())();
