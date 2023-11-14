import i18n from 'i18next';
import {getI18NextOptions} from './app.config';
import {i18NextBackend, i18NextBackendOptions} from '../renderer/polyfills';

const i18nextOptions = getI18NextOptions(i18NextBackendOptions);

if (!i18n.isInitialized) {
  i18n.use(i18NextBackend).init(i18nextOptions);
}

export default i18n;
