import {Input, Space} from 'antd';
import {useTranslation} from 'react-i18next';

import {INPUT} from '../../../constants/antd-types.js';
import {PROVIDER_VALUES} from '../../../constants/session-builder.js';

const ServerTabRabbitQA = ({server, setServerParam}) => {
  const {t} = useTranslation();
  return (
    <Space.Compact block>
      <Space.Addon>{t('RabbitQA API Key')}</Space.Addon>
      <Input
        id="rabbitqaApiKey"
        type={INPUT.PASSWORD}
        placeholder={PROVIDER_VALUES.RABBITQA_API_KEY}
        value={server.rabbitqa?.apiKey}
        onChange={(e) => setServerParam('apiKey', e.target.value)}
      />
    </Space.Compact>
  );
};

export default ServerTabRabbitQA;
