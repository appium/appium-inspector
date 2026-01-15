import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';

import {commonI18NextOptions} from '../shared/i18next.config.js';
import {PREFERRED_LANGUAGE} from '../shared/setting-defs.js';
import {getSetting, i18NextBackend, i18NextBackendOptions} from './polyfills.js';

const i18nextOptions = {
  ...commonI18NextOptions,
  backend: i18NextBackendOptions,
  lng: await getSetting(PREFERRED_LANGUAGE),
};

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).use(i18NextBackend).init(i18nextOptions);
}

export default i18n;
