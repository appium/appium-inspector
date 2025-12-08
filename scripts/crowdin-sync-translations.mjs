import path from 'node:path';

import {fs, net, tempDir, zip} from '@appium/support';
import {waitForCondition} from 'asyncbox';

import {log, ORIGINAL_LANGUAGE, performApiRequest, RESOURCES_ROOT} from './crowdin-common.mjs';

const BUILD_TIMEOUT_MS = 1000 * 60 * 10;
const BUILD_STATUS = {
  finished: 'finished',
  created: 'created',
  inProgress: 'inProgress',
  canceled: 'canceled',
  failed: 'failed',
};

async function buildTranslations() {
  log.info('Building project translations');
  const {data: buildData} = await performApiRequest('/translations/builds', {
    method: 'POST',
  });
  return buildData.id;
}

async function downloadTranslations(buildId, dstPath) {
  log.info(`Waiting up to ${BUILD_TIMEOUT_MS / 1000}s for the build #${buildId} to finish`);
  await waitForCondition(
    async () => {
      const {data: buildData} = await performApiRequest(`/translations/builds/${buildId}`);
      switch (buildData.status) {
        case BUILD_STATUS.finished:
          return true;
        case BUILD_STATUS.inProgress:
        case BUILD_STATUS.created:
          return false;
        default:
          throw new Error(`The translations build got an unexpected status '${buildData.status}'`);
      }
    },
    {
      waitMs: BUILD_TIMEOUT_MS,
      intervalMs: 1000,
    },
  );
  const {data: downloadData} = await performApiRequest(`/translations/builds/${buildId}/download`);
  log.info(`Downloading translations to '${dstPath}'`);
  await net.downloadFile(downloadData.url, dstPath);
}

async function main() {
  const buildId = await buildTranslations();
  const zipPath = await tempDir.path({prefix: 'translations', suffix: '.zip'});
  try {
    await downloadTranslations(buildId, zipPath);
    const tmpRoot = await tempDir.openDir();
    try {
      await zip.extractAllTo(zipPath, tmpRoot);
      for (const name of await fs.readdir(tmpRoot)) {
        const currentPath = path.join(tmpRoot, name);
        if (!(await fs.stat(currentPath)).isDirectory() || name === ORIGINAL_LANGUAGE) {
          continue;
        }

        const dstPath = path.resolve(RESOURCES_ROOT, name);
        log.debug(`Moving '${currentPath}' to '${dstPath}'`);
        if (await fs.exists(dstPath)) {
          await fs.rimraf(dstPath);
        }
        await fs.mv(currentPath, dstPath, {
          mkdirp: true,
        });
        log.info(`Successfully updated resources for the '${name}' language`);
      }
    } finally {
      await fs.rimraf(tmpRoot);
    }
  } finally {
    await fs.rimraf(zipPath);
  }
}

(async () => await main())();
