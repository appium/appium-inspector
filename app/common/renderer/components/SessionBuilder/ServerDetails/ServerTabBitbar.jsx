import {Col, Input, Row, Space} from 'antd';
import {useTranslation} from 'react-i18next';

import {INPUT} from '../../../constants/antd-types.js';

const bitbarApiKeyPlaceholder = (t) => {
  if (process.env.BITBAR_API_KEY) {
    return t('usingDataFoundIn', {environmentVariable: 'BITBAR_API_KEY'});
  }
  return t('yourApiKey');
};

const ServerTabBitbar = ({server, setServerParam}) => {
  const {t} = useTranslation();
  return (
    <Row gutter={8}>
      <Col span={24}>
        <Space.Compact block>
          <Space.Addon>{t('Bitbar API Key')}</Space.Addon>
          <Input
            id="bitbarApiKey"
            type={INPUT.PASSWORD}
            placeholder={bitbarApiKeyPlaceholder(t)}
            value={server.bitbar.apiKey}
            onChange={(e) => setServerParam('apiKey', e.target.value)}
          />
        </Space.Compact>
      </Col>
    </Row>
  );
};

export default ServerTabBitbar;
