import {Col, Input, Row, Space} from 'antd';
import {useTranslation} from 'react-i18next';

import {PROVIDER_VALUES} from '../../../constants/session-builder.js';
import builderStyles from '../SessionBuilder.module.css';

const ServerTabTestcribe = ({server, setServerParam}) => {
  const {t} = useTranslation();
  return (
    <Row gutter={8}>
      <Col span={24}>
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
      </Col>
    </Row>
  );
};

export default ServerTabTestcribe;
