import {join} from 'node:path';

import settings from 'electron-settings';
import i18n from 'i18next';
import i18NextBackend from 'i18next-fs-backend';

import {commonI18NextOptions, fallbackLng} from '../../common/shared/i18next.config.js';
import {PREFERRED_LANGUAGE} from '../../common/shared/setting-defs.js';

const localesPath =
  process.env.NODE_ENV === 'development'
    ? join('app', 'common', 'public', 'locales') // from project root
    : join(__dirname, '..', 'renderer', 'locales'); // from 'main' in package.json
const translationFilePath = join(localesPath, '{{lng}}', '{{ns}}.json');

const i18nextOptions = {
  ...commonI18NextOptions,
  lng: settings.getSync(PREFERRED_LANGUAGE) || fallbackLng,
  backend: {
    loadPath: translationFilePath,
    addPath: translationFilePath,
    jsonIndent: 2,
  },
};

if (!i18n.isInitialized) {
  i18n.use(i18NextBackend).init(i18nextOptions);
}

export default i18n;
