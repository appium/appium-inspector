import React from 'react';
import { Form, Row, Col, Input } from 'antd';
import { INPUT } from '../AntdTypes';

const ServerTabRemoteTestkit = ({ server, setServerParam, t }) => (
  <Form>
    <Row gutter={8}>
      <Col span={24}>
        <Form.Item>
          <Input id='remoteTestKitAccessToken' type={INPUT.PASSWORD} addonBefore={t('RemoteTestKit AccessToken')} value={server.remotetestkit.token}
            onChange={(e) => setServerParam('token', e.target.value)} />
        </Form.Item>
      </Col>
    </Row>
  </Form>
);

export default ServerTabRemoteTestkit;
