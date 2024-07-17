import {Checkbox, Col, Form, Input, Row} from 'antd';
import React from 'react';

import {DEFAULT_SERVER_HOST, DEFAULT_SERVER_PATH, DEFAULT_SERVER_PORT} from '../../actions/Session';

const ServerTabCustom = ({server, setServerParam, t}) => (
  <Form>
    <Row gutter={8}>
      <Col span={9}>
        <Form.Item>
          <Input
            id="customServerHost"
            placeholder={DEFAULT_SERVER_HOST}
            addonBefore={t('Remote Host')}
            value={server.remote.hostname}
            onChange={(e) => setServerParam('hostname', e.target.value)}
          />
        </Form.Item>
      </Col>
      <Col span={4}>
        <Form.Item>
          <Input
            id="customServerPort"
            placeholder={DEFAULT_SERVER_PORT}
            addonBefore={t('Remote Port')}
            value={server.remote.port}
            onChange={(e) => setServerParam('port', e.target.value)}
          />
        </Form.Item>
      </Col>
      <Col span={9}>
        <Form.Item>
          <Input
            id="customServerPath"
            placeholder={DEFAULT_SERVER_PATH}
            addonBefore={t('Remote Path')}
            value={server.remote.path}
            onChange={(e) => setServerParam('path', e.target.value)}
          />
        </Form.Item>
      </Col>
      <Col span={2}>
        <Form.Item>
          <Checkbox
            id="customServerSSL"
            checked={!!server.remote.ssl}
            value={server.remote.ssl}
            onChange={(e) => setServerParam('ssl', e.target.checked)}
          >
            {t('SSL')}
          </Checkbox>
        </Form.Item>
      </Col>
    </Row>
  </Form>
);

export default ServerTabCustom;
