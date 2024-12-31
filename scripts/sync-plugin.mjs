import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {fs} from '@appium/support';

const ROOT_PKG_JSON_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'package.json',
);
const PLUGIN_PKG_JSON_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'plugins',
  'package.json',
);

async function readJson(path) {
  return await fs.readFile(path, 'utf8');
}

async function main() {
  const rootJsonContent = await JSON.parse(await readJson(ROOT_PKG_JSON_PATH));
  const pluginJsonContent = await JSON.parse(await readJson(PLUGIN_PKG_JSON_PATH));
  pluginJsonContent.version = rootJsonContent.version;
  await fs.writeFile(PLUGIN_PKG_JSON_PATH, JSON.stringify(pluginJsonContent, null, 2), 'utf8');
}

(async () => await main())();
