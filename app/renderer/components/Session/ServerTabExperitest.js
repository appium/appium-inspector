import {Col, Form, Input, Row} from 'antd';
import React from 'react';

import SessionStyles from './Session.css';

const accessKeyPlaceholder = 'accessKey';
const placeholderUrl = 'https://example.experitest.com';

const ServerTabExperitest = ({server, setServerParam, t}) => (
  <Form>
    <Row gutter={8}>
      <Col span={12}>
        <Form.Item>
          <Input
            className={SessionStyles.customServerInputLeft}
            id="ExperitestServerUrl"
            placeholder={placeholderUrl}
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
            placeholder={accessKeyPlaceholder}
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
