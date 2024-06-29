import {Col, Form, Input, Row} from 'antd';
import React from 'react';

import {INPUT} from '../../constants/antd-types';

const kobitonUsernamePlaceholder = (t) => {
  if (process.env.KOBITON_USERNAME) {
    return t('usingDataFoundIn', {environmentVariable: 'KOBITON_USERNAME'});
  }
  return t('yourUsername');
};

const kobitonAccessKeyPlaceholder = (t) => {
  if (process.env.KOBITON_ACCESS_KEY) {
    return t('usingDataFoundIn', {environmentVariable: 'KOBITON_ACCESS_KEY'});
  }
  return t('yourAccessKey');
};

const ServerTabKobiton = ({server, setServerParam, t}) => (
  <Form>
    <Row gutter={8}>
      <Col span={12}>
        <Form.Item>
          <Input
            id="kobitonUsername"
            placeholder={kobitonUsernamePlaceholder(t)}
            addonBefore={t('Your Kobiton Username')}
            value={server.kobiton.username}
            onChange={(e) => setServerParam('username', e.target.value)}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item>
          <Input
            id="kobitonAccessKey"
            type={INPUT.PASSWORD}
            placeholder={kobitonAccessKeyPlaceholder(t)}
            addonBefore={t('Kobiton Access Key')}
            value={server.kobiton.accessKey}
            onChange={(e) => setServerParam('accessKey', e.target.value)}
          />
        </Form.Item>
      </Col>
    </Row>
  </Form>
);

export default ServerTabKobiton;
