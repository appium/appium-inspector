import {Col, Form, Input, Row} from 'antd';
import React from 'react';

import SessionStyles from './Session.css';

const headspinUrl = 'https://xxxx.headspin.io:4723/v0/your-api-token/wd/hub';

const ServerTabHeadspin = ({server, setServerParam, t}) => (
  <Form>
    <Row gutter={8}>
      <Col span={24}>
        <Form.Item>
          <Input
            className={SessionStyles.customServerInputLeft}
            id="headspinServerHost"
            placeholder={headspinUrl}
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
