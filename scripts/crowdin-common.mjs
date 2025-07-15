import path from 'node:path';

import {logger} from '@appium/support';
import axios from 'axios';
import _ from 'lodash';

export const log = logger.getLogger('CROWDIN');

// https://developer.crowdin.com/api/v2/
const PROJECT_ID = process.env.CROWDIN_PROJECT_ID;
const API_TOKEN = process.env.CROWDIN_TOKEN;
if (!PROJECT_ID || !API_TOKEN) {
  throw new Error(`Both CROWDIN_PROJECT_ID and CROWDIN_TOKEN environment variables must be set`);
}
export const RESOURCES_ROOT = path.resolve('app', 'common', 'public', 'locales');
export const ORIGINAL_LANGUAGE = 'en';
const USER_AGENT = 'Appium Inspector CI';
const API_ROOT = 'https://api.crowdin.com/api/v2';

export async function performApiRequest(suffix = '', opts = {}) {
  const {method = 'GET', payload, headers, isProjectSpecific = true} = opts;
  const url = isProjectSpecific
    ? `${API_ROOT}/projects/${PROJECT_ID}${suffix}`
    : `${API_ROOT}${suffix}`;
  log.debug(`Sending ${method} request to ${url}`);
  if (_.isPlainObject(payload)) {
    log.debug(`Request payload: ${JSON.stringify(payload)}`);
  }
  return (
    await axios({
      method,
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': USER_AGENT,
        ...(headers || {}),
      },
      url,
      data: payload,
    })
  ).data;
}
