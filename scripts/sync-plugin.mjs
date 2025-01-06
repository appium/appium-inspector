import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const PROJECT_ROOT = path.dirname(fileURLToPath(import.meta.url));
const ROOT_PKG_JSON_PATH = path.resolve(PROJECT_ROOT, '..', 'package.json');
const PLUGIN_PKG_JSON_PATH = path.resolve(PROJECT_ROOT, '..', 'plugins', 'package.json');

const SYNC_PACKAGE_KEYS = [
  // To update ever version release
  'version',

  // These basic information should be the same with the top package.json
  'engines',
  'license',
  'repository',
  'author',
  'bugs',
  'homepage',
];

/**
 * Return JSON parsed contents from the given path.
 * @param {string} path
 * @returns {object}
 */
async function readJsonContent(jsonPath) {
  return JSON.parse(await fs.readFile(jsonPath, 'utf8'));
}

async function main() {
  const [rootJsonContent, pluginJsonContent] = await Promise.all(
    [ROOT_PKG_JSON_PATH, PLUGIN_PKG_JSON_PATH].map(readJsonContent),
  );

  for (const key of SYNC_PACKAGE_KEYS) {
    pluginJsonContent[key] = rootJsonContent[key];
  }

  // The new line in the last is to avoid prettier error.
  await fs.writeFile(
    PLUGIN_PKG_JSON_PATH,
    `${JSON.stringify(pluginJsonContent, null, 2)}\n`,
    'utf8',
  );
}

(async () => await main())();
