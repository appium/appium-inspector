import i18n from 'i18next';
import i18NextBackend from 'i18next-chained-backend';
import HttpApi from 'i18next-http-backend';
import LocalStorageBackend from 'i18next-localstorage-backend';
import {initReactI18next} from 'react-i18next';

import {commonI18NextOptions} from '../shared/i18next.config.js';
import {PREFERRED_LANGUAGE} from '../shared/setting-defs.js';
import {getSetting, localesPath} from './polyfills.js';

const i18nextOptions = {
  ...commonI18NextOptions,
  lng: await getSetting(PREFERRED_LANGUAGE),
  backend: {
    backends: [LocalStorageBackend, HttpApi],
    backendOptions: [
      {},
      {
        loadPath: `${localesPath}/{{lng}}/{{ns}}.json`,
      },
    ],
  },
};

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).use(i18NextBackend).init(i18nextOptions);
}

export default i18n;
