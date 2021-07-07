import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import config from './app.config';
import settings from '../shared/settings';
import { i18NextBackend, i18NextBackendOptions } from '../renderer/polyfills';
import { getI18NextOptions } from '../../gui-common/configs/app.config.default';

const i18nextOptions = getI18NextOptions(settings, config, i18NextBackendOptions);

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .use(i18NextBackend)
    .init(i18nextOptions);
}

export default i18n;
