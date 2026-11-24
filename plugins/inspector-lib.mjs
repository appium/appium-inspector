/**
 * Inspector app code used by the session recorder on the server (locator generation, source parsing,
 * code generators). Inside the repository it is loaded from source, so changes apply without a build;
 * the published plugin uses the bundle that `npm run build:plugin` writes to lib/.
 */
import {existsSync} from 'node:fs';

const SOURCE_URL = new URL('./lib-src/inspector-lib.mjs', import.meta.url);
const SOURCE_APP_DIR = new URL('../app/common/renderer/', import.meta.url);
const BUNDLE_URL = new URL('./lib/inspector-lib.mjs', import.meta.url);

const lib = await import(existsSync(SOURCE_APP_DIR) ? SOURCE_URL.href : BUNDLE_URL.href);

export const {CLIENT_FRAMEWORK_MAP, getSuggestedLocators, xmlToJSON} = lib;
