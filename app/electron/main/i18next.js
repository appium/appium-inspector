import settings from 'electron-settings';
import i18n from 'i18next';
import i18NextBackend from 'i18next-fs-backend';
import {join} from 'path';

import {commonI18NextOptions, fallbackLng} from '../../common/shared/i18next.config';
import {PREFERRED_LANGUAGE} from '../../common/shared/setting-defs';

const localesPath =
  process.env.NODE_ENV === 'development'
    ? join('app', 'common', 'public', 'locales') // from project root
    : join(__dirname, '..', 'renderer', 'locales'); // from 'main' in package.json
const translationFilePath = join(localesPath, '{{lng}}', '{{ns}}.json');

const i18NextBackendOptions = {
  loadPath: translationFilePath,
  addPath: translationFilePath,
  jsonIndent: 2,
};

const i18nextOptions = {
  ...commonI18NextOptions,
  backend: i18NextBackendOptions,
  lng: settings.getSync(PREFERRED_LANGUAGE) || fallbackLng,
};

if (!i18n.isInitialized) {
  i18n.use(i18NextBackend).init(i18nextOptions);
}

export default i18n;
