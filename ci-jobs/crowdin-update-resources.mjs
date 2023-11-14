import path from 'node:path';
import {createReadStream} from 'node:fs';
import B from 'bluebird';
import {log, RESOURCES_ROOT, ORIGINAL_LANGUAGE, performApiRequest} from './crowdin-common.mjs';

const RESOURCE_NAME = 'translation.json';
const RESOURCE_PATH = path.resolve(RESOURCES_ROOT, ORIGINAL_LANGUAGE, RESOURCE_NAME);

async function uploadToStorage() {
  log.info(`Uploading '${RESOURCE_PATH}' to Crowdin`);
  const {data: storageData} = await performApiRequest('/storages', {
    method: 'POST',
    headers: {
      'Crowdin-API-FileName': encodeURIComponent(RESOURCE_NAME),
    },
    payload: createReadStream(RESOURCE_PATH),
    isProjectSpecific: false,
  });
  log.info(`'${RESOURCE_NAME}' has been succesfully uploaded to Crowdin`);
  return storageData.id;
}

async function getFileId() {
  const {data: filesData} = await performApiRequest('/files');
  const mainFile = filesData.map(({data}) => data).find(({name}) => name === RESOURCE_NAME);
  if (!mainFile) {
    log.debug(JSON.stringify(filesData));
    throw new Error(`Cannot determine the Crowdin identifier of the '${RESOURCE_NAME}' resource`);
  }
  return mainFile.id;
}

async function updateFile(fileId, storageId) {
  log.info(`Updating the project with the newly uploaded '${RESOURCE_NAME}' instance`);
  await performApiRequest(`/files/${fileId}`, {
    method: 'PUT',
    payload: {
      storageId,
    },
  });
}

async function main() {
  const [storageId, fileId] = await B.all([uploadToStorage(), getFileId()]);
  await updateFile(fileId, storageId);
  log.info('All done');
}

(async () => await main())();
