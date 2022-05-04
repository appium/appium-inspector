const open = require('open');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers')
const { fs } = require('appium-support');
const serveStatic = require('serve-static');
const http = require('http');
const path = require('path');
const finalhandler = require('finalhandler');
const portfinder = require('portfinder');
const {logger} = require('appium-support');

const log = logger.getLogger('appium-inspector');

module.exports.openAppiumInspector = async function openAppiumInspector ({
  sessionFile, stateJson, autoStart = false,
}) {
  // start a static server to serve the dist-browser files
  const distBrowser = path.join(__dirname, 'dist-browser');
  const serve = serveStatic(distBrowser, {index: ['index.html']});
  const server = http.createServer(function onRequest (req, res) {
    serve(req, res, finalhandler)
  });
  const port = await portfinder.getPortPromise({port: 8888});
  log.info(`Starting static server on port ${port} serving ${distBrowser}`);
  server.listen(port);

  let state = {};
  if (sessionFile) {
    if (!await fs.exists(sessionFile)) {
      throw new Error(`Session file ${sessionFile} does not exist`);
    }
    try {
      const sessionFileContents = JSON.parse(await fs.readFile(sessionFile, 'utf8'));
      state = {...state, ...sessionFileContents};
    } catch (e) {
      throw new Error(`Session file ${sessionFile} is not valid JSON`);
    }
  }

  if (stateJson) {
    try {
      state = {...state, ...JSON.parse(stateJson)};
    } catch (e) {
      throw new Error(`State JSON is not valid JSON`);
    }
  }

  const url = new URL(`http://127.0.0.1:${port}/index.html`);
  url.searchParams.append('state', JSON.stringify(state));
  url.searchParams.append('autoStart', autoStart);
  try {
    log.info(`Opening inspector at ${url.href}`);
    return await open(url.href);
  } catch (e) {
    throw new Error(`Could not open inspector: ${e.message} ${e.stack}`);
  }
}

if (require.main === module) {
  yargs(hideBin(process.argv))
    .command('$0', 'opens an Appium Inspector', async ({argv}) => {
      await module.exports.openAppiumInspector(argv);
    })
    .option('session-file', {
      alias: 'f',
      type: 'string',
      description: '.appiumsession file to use for initial state',
    })
    .option('state-json', {
      alias: 's',
      type: 'string',
      description: 'JSON string to use for initial state',
    })
    .option('auto-start', {
      alias: 'auto',
      type: 'boolean',
      description: 'starts the inspector session automatically',
    })
    .parse();
}
