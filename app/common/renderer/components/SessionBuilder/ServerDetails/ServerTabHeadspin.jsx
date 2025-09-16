import {Col, Form, Input, Row} from 'antd';

import {PROVIDER_VALUES} from '../../../constants/session-builder.js';
import builderStyles from '../SessionBuilder.module.css';

const ServerTabHeadspin = ({server, setServerParam, t}) => (
  <Form>
    <Row gutter={8}>
      <Col span={24}>
        <Form.Item>
          <Input
            id="headspinServerHost"
            placeholder={PROVIDER_VALUES.HEADSPIN_URL}
            addonBefore={t('serverTabHeasdpinWebDriverURL')}
            value={server.headspin.webDriverUrl}
            onChange={(e) => setServerParam('webDriverUrl', e.target.value)}
          />
          <p className={builderStyles.localDesc}>{t('sessionHeadspinWebDriverURLDescription')}</p>
        </Form.Item>
      </Col>
    </Row>
  </Form>
);

export default ServerTabHeadspin;
