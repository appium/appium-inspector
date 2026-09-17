import {Input, Space} from 'antd';
import {useTranslation} from 'react-i18next';

import {PROVIDER_VALUES} from '../../../constants/session-builder.js';

import builderStyles from '../SessionBuilder.module.css';

const ServerTabTestcribe = ({server, setServerParam}) => {
  const {t} = useTranslation();
  return (
    <>
      <Space.Compact block>
        <Space.Addon>{t('TestcribeAPIKey')}</Space.Addon>
        <Input
          id="testcribeServerHost"
          placeholder={PROVIDER_VALUES.TESTCRIBE_API_KEY}
          value={server.testcribe.apiKey}
          onChange={(e) => setServerParam('apiKey', e.target.value)}
        />
      </Space.Compact>
      <p className={builderStyles.localDesc}>{t('sessionTestcribeApiKeyDescription')}</p>
    </>
  );
};

export default ServerTabTestcribe;
