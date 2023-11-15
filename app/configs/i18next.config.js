import i18n from 'i18next';

import {i18NextBackend, i18NextBackendOptions} from '../renderer/polyfills';
import {getI18NextOptions} from './app.config';

const i18nextOptions = getI18NextOptions(i18NextBackendOptions);

if (!i18n.isInitialized) {
  i18n.use(i18NextBackend).init(i18nextOptions);
}

export default i18n;
