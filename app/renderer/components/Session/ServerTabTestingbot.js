import React from 'react';
import {Form, Input, Row, Col} from 'antd';
import {INPUT} from '../AntdTypes';

const testingbotKeyPlaceholder = (t) => {
  if (process.env.TB_KEY) {
    return t('usingDataFoundIn', {environmentVariable: 'TB_KEY'});
  }
  return t('yourUsername');
};

const testingbotSecretPlaceholder = (t) => {
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
            placeholder={testingbotKeyPlaceholder(t)}
            addonBefore={t('TestingBot Key')}
            value={server.testingbot.key}
            onChange={(e) => setServerParam('key', e.target.value)}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item>
          <Input
            id="testingbotSecret"
            type={INPUT.PASSWORD}
            placeholder={testingbotSecretPlaceholder(t)}
            addonBefore={t('TestingBot Secret')}
            value={server.testingbot.secret}
            onChange={(e) => setServerParam('secret', e.target.value)}
          />
        </Form.Item>
      </Col>
    </Row>
  </Form>
);

export default ServerTabTestingbot;
