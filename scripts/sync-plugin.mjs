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

  // To update ever version release
  pluginJsonContent.version = rootJsonContent.version;

  // These basic information should be the same with the top package.json
  pluginJsonContent.engines = rootJsonContent.engines;
  pluginJsonContent.license = rootJsonContent.license;
  pluginJsonContent.repository = rootJsonContent.repository;
  pluginJsonContent.author = rootJsonContent.author;
  pluginJsonContent.bugs = rootJsonContent.bugs;
  pluginJsonContent.homepage = rootJsonContent.homepage;

  // The new line in the last is to avoid prettier error.
  await fs.writeFile(
    PLUGIN_PKG_JSON_PATH,
    `${JSON.stringify(pluginJsonContent, null, 2)}\n`,
    'utf8',
  );
}

(async () => await main())();
