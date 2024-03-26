import {Col, Form, Input, Row} from 'antd';
import React from 'react';

import {PROVIDER_VALUES} from '../../constants/session-builder';
import SessionStyles from './Session.css';

const ServerTabExperitest = ({server, setServerParam, t}) => (
  <Form>
    <Row gutter={8}>
      <Col span={12}>
        <Form.Item>
          <Input
            className={SessionStyles.customServerInputLeft}
            id="ExperitestServerUrl"
            placeholder={PROVIDER_VALUES.EXPERITEST_URL}
            addonBefore={t('experitestUrl')}
            value={server.experitest.url}
            onChange={(evt) => setServerParam('url', evt.target.value)}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item>
          <Input
            className={SessionStyles.customServerInputLeft}
            id="ExperitestServerAccessKey"
            placeholder={PROVIDER_VALUES.EXPERITEST_ACCESS_KEY}
            addonBefore={t('experitestAccessKey')}
            value={server.experitest.accessKey}
            onChange={(evt) => setServerParam('accessKey', evt.target.value)}
          />
        </Form.Item>
      </Col>
    </Row>
  </Form>
);

export default ServerTabExperitest;
