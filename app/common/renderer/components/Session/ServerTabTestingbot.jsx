import {Col, Form, Input, Row} from 'antd';
import React from 'react';

import {INPUT} from '../../constants/antd-types';

const testingbotUsernamePlaceholder = (t) => {
  if (process.env.TB_KEY) {
    return t('usingDataFoundIn', {environmentVariable: 'TB_KEY'});
  }
  return t('yourUsername');
};

const testingbotAccessKeyPlaceholder = (t) => {
  if (process.env.TB_SECRET) {
    return t('usingDataFoundIn', {environmentVariable: 'TB_SECRET'});
  }
  return t('yourAccessKey');
};

const ServerTabTestingbot = ({server, setServerParam, t}) => (
  <Form>
    <Row gutter={8}>
      <Col span={12}>
        <Form.Item>
          <Input
            id="testingbotKey"
            placeholder={testingbotUsernamePlaceholder(t)}
            addonBefore={t('TestingBot Key')}
            value={server.testingbot.username}
            onChange={(e) => setServerParam('username', e.target.value)}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item>
          <Input
            id="testingbotSecret"
            type={INPUT.PASSWORD}
            placeholder={testingbotAccessKeyPlaceholder(t)}
            addonBefore={t('TestingBot Secret')}
            value={server.testingbot.accessKey}
            onChange={(e) => setServerParam('accessKey', e.target.value)}
          />
        </Form.Item>
      </Col>
    </Row>
  </Form>
);

export default ServerTabTestingbot;
