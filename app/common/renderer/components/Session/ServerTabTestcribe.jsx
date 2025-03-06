import {Col, Form, Input, Row} from 'antd';

import {PROVIDER_VALUES} from '../../constants/session-builder';
import SessionStyles from './Session.module.css';

const ServerTabTestcribe = ({server, setServerParam, t}) => (
  <Form>
    <Row gutter={8}>
      <Col span={24}>
        <Form.Item>
          <Input
            className={SessionStyles.customServerInputLeft}
            id="testcribeServerHost"
            placeholder={PROVIDER_VALUES.TESTCRIBE_API_KEY}
            addonBefore={t('TestcribeAPIKey')}
            value={server.testcribe.apiKey}
            onChange={(e) => setServerParam('apiKey', e.target.value)}
          />
          <p className={SessionStyles.localDesc}>{t('sessionTestcribeApiKeyDescription')}</p>
        </Form.Item>
      </Col>
    </Row>
  </Form>
);

export default ServerTabTestcribe;
