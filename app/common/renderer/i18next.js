import i18n from 'i18next';
import _ from 'lodash';
import {initReactI18next, withTranslation as wt} from 'react-i18next';

import {i18NextBackend, i18NextBackendOptions} from './polyfills';
import {getI18NextOptions} from '../shared/i18next.config';

const i18nextOptions = getI18NextOptions(i18NextBackendOptions);
const namespace = 'translation';

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).use(i18NextBackend).init(i18nextOptions);
}

export function withTranslation(componentCls, ...hocs) {
  return _.flow(...hocs, wt(namespace))(componentCls);
}

export default i18n;
