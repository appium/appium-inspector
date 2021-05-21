const path = require('path');
const ncp = require('ncp');
const mkdirp = require('mkdirp');
const {fs, logger} = require('appium-support');
const {asyncify} = require('asyncbox');

const EN_RESOURCE_PATH = ['assets', 'locales', 'en'];
const log = logger.getLogger('i18n');

async function main () {
  let serverPath = process.argv[2];

  if (!serverPath) {
    throw new Error(`Usage: node copy-en-i18n.js <appium desktop server path>`);
  }

  serverPath = path.resolve(__dirname, serverPath);

  const enPath = path.resolve(serverPath, ...EN_RESOURCE_PATH);
  log.info(`Attempting to copy en resourcces from ${enPath}`);
  if (!await fs.exists(enPath)) {
    throw new Error(`Could not find en resources at ${enPath}`);
  }

  const localEnPath = path.resolve(__dirname, ...EN_RESOURCE_PATH);

  log.info(`Copying to ${localEnPath}`);
  await mkdirp(localEnPath);
  await ncp(enPath, localEnPath);

  log.info(`Success`);
}

asyncify(main);
