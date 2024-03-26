import {Col, Form, Input, Row} from 'antd';
import React from 'react';

import {PROVIDER_VALUES} from '../../constants/session-builder';
import SessionStyles from './Session.css';

const ServerTabHeadspin = ({server, setServerParam, t}) => (
  <Form>
    <Row gutter={8}>
      <Col span={24}>
        <Form.Item>
          <Input
            className={SessionStyles.customServerInputLeft}
            id="headspinServerHost"
            placeholder={PROVIDER_VALUES.HEADSPIN_URL}
            addonBefore={t('serverTabHeasdpinWebDriverURL')}
            value={server.headspin.webDriverUrl}
            onChange={(e) => setServerParam('webDriverUrl', e.target.value)}
          />
          <p className={SessionStyles.localDesc}>{t('sessionHeadspinWebDriverURLDescription')}</p>
        </Form.Item>
      </Col>
    </Row>
  </Form>
);

export default ServerTabHeadspin;
