import i18n from 'i18next';
import _ from 'lodash';
import {initReactI18next, withTranslation as wt} from 'react-i18next';

import {commonI18NextOptions, fallbackLng} from '../shared/i18next.config';
import {PREFERRED_LANGUAGE} from '../shared/setting-defs';
import {i18NextBackend, i18NextBackendOptions, getSettingSync} from './polyfills';

const i18nextOptions = {
  ...commonI18NextOptions,
  backend: i18NextBackendOptions,
  lng: getSettingSync(PREFERRED_LANGUAGE) || fallbackLng,
};

const namespace = 'translation';

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).use(i18NextBackend).init(i18nextOptions);
}

export function withTranslation(componentCls, ...hocs) {
  return _.flow(...hocs, wt(namespace))(componentCls);
}

export default i18n;
