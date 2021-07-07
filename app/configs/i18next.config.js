import i18n from 'i18next';
import { i18NextBackend, i18NextBackendOptions } from '../renderer/polyfills';
import config from './app.config';
import settings from '../shared/settings';
import { getI18NextOptions } from '../../gui-common/configs/app.config.default';

const i18nextOptions = getI18NextOptions(settings, config, i18NextBackendOptions);

if (!i18n.isInitialized) {
  i18n
    .use(i18NextBackend)
    .init(i18nextOptions);
}

export default i18n;
