import {Input, Space} from 'antd';
import {useTranslation} from 'react-i18next';

import {INPUT} from '../../../constants/antd-types.js';

const tvlabsApiKeyPlaceholder = (t) => {
  if (process.env.TVLABS_API_KEY) {
    return t('usingDataFoundIn', {environmentVariable: 'TVLABS_API_KEY'});
  }
  return t('yourApiKey');
};

const ServerTabTVLabs = ({server, setServerParam}) => {
  const {t} = useTranslation();
  return (
    <Space.Compact block>
      <Space.Addon>{t('TV Labs API Key')}</Space.Addon>
      <Input
        id="tvlabsApiKey"
        type={INPUT.PASSWORD}
        placeholder={tvlabsApiKeyPlaceholder(t)}
        value={server.tvlabs.apiKey}
        onChange={(e) => setServerParam('apiKey', e.target.value)}
      />
    </Space.Compact>
  );
};

export default ServerTabTVLabs;
