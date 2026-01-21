import {Col, Input, Row, Space} from 'antd';
import {useTranslation} from 'react-i18next';

import {INPUT} from '../../../constants/antd-types.js';
import {PROVIDER_VALUES} from '../../../constants/session-builder.js';

const ServerTabRabbitQA = ({server, setServerParam}) => {
  const {t} = useTranslation();
  return (
    <Row gutter={8}>
      <Col span={24}>
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
      </Col>
    </Row>
  );
};

export default ServerTabRabbitQA;
