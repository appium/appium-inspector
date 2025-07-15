import {fs, logger} from '@appium/support';
import {retryInterval} from 'asyncbox';
import os from 'os';
import {join} from 'path';
import {expect} from 'vitest';

const platform = os.platform();
const appName = 'inspector';
const log = logger.getLogger('E2E Test');

describe('E2E tests', function () {
  before(async function () {
    let appPath;
    // let args = [];
    if (process.env.SPECTRON_TEST_PROD_BINARIES) {
      if (platform === 'linux') {
        appPath = join(
          __dirname,
          '..',
          '..',
          appName,
          'release',
          'linux-unpacked',
          'appium-desktop',
        );
      } else if (platform === 'darwin') {
        appPath = join(
          __dirname,
          '..',
          '..',
          appName,
          'release',
          'mac',
          'Appium.app',
          'Contents',
          'MacOS',
          'Appium',
        );
      } else if (platform === 'win32') {
        appPath = join(
          __dirname,
          '..',
          '..',
          appName,
          'release',
          'win-ia32-unpacked',
          'Appium.exe',
        );
      }
    } else {
      appPath = require(join(__dirname, '..', '..', 'node_modules', 'electron'));
      // args = [join(__dirname, '..', '..')];
    }

    this.timeout(process.env.E2E_TIMEOUT || 60 * 1000);
    log.info(`Running Appium from: ${appPath}`);
    log.info(`Checking that "${appPath}" exists`);
    const applicationExists = await fs.exists(appPath);
    if (!applicationExists) {
      log.error(`Could not run tests. "${appPath}" does not exist.`);
      process.exit(1);
    }
    log.info(`App exists. Creating application instance`);
    // this.app = new Application({
    //   path: appPath,
    //   env: {
    //     FORCE_NO_WRONG_FOLDER: true,
    //   },
    //   args,
    // });
    log.info(`Application instance created. Starting app`);
    await this.app.start();
    const client = this.app.client;
    log.info(`App started; waiting for splash page to go away`);
    await retryInterval(20, 1000, async function () {
      const handles = await client.getWindowHandles();
      await client.switchToWindow(handles[0]);
      expect(await client.getUrl()).toContain('index.html');
    });
    log.info(`App ready for automation`);
  });

  after(function () {
    if (this.app && this.app.isRunning()) {
      return this.app.stop();
    }
  });
});
