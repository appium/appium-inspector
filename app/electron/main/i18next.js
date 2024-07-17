import i18n from 'i18next';
import i18NextBackend from 'i18next-fs-backend';
import path from 'path';

import {getI18NextOptions} from '../../common/shared/i18next.config';

const i18NextBackendOptions = {
  loadPath: path.join(__dirname, '{{lng}}/{{ns}}.json'),
  jsonIndent: 2,
};

const i18nextOptions = getI18NextOptions(i18NextBackendOptions);

if (!i18n.isInitialized) {
  i18n.use(i18NextBackend).init(i18nextOptions);
}

export default i18n;
