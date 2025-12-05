import {Col, Input, Row, Space} from 'antd';

import {PROVIDER_VALUES} from '../../../constants/session-builder.js';
import builderStyles from '../SessionBuilder.module.css';

const ServerTabHeadspin = ({server, setServerParam, t}) => (
  <Row gutter={8}>
    <Col span={24}>
      <Space.Compact block>
        <Space.Addon>{t('serverTabHeasdpinWebDriverURL')}</Space.Addon>
        <Input
          id="headspinServerHost"
          placeholder={PROVIDER_VALUES.HEADSPIN_URL}
          value={server.headspin.webDriverUrl}
          onChange={(e) => setServerParam('webDriverUrl', e.target.value)}
        />
      </Space.Compact>
      <p className={builderStyles.localDesc}>{t('sessionHeadspinWebDriverURLDescription')}</p>
    </Col>
  </Row>
);

export default ServerTabHeadspin;
