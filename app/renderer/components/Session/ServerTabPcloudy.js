import React from 'react';
import {Form, Row, Col, Input} from 'antd';
import SessionStyles from './Session.css';
import {INPUT} from '../AntdTypes';

const pcloudyUsernamePlaceholder = 'username@pcloudy.com';
const pcloudyHostPlaceholder = 'cloud.pcloudy.com';
const pcloudyAccessKeyExample = 'kjdgtdwn65fdasd78uy6y';

const ServerTabPcloudy = ({server, setServerParam, t}) => (
  <Form>
    <Row gutter={8}>
      <Col span={8}>
        <Form.Item>
          <Input
            className={SessionStyles.customServerInputLeft}
            id="PcloudyServerHost"
            placeholder={pcloudyHostPlaceholder}
            addonBefore={t('Pcloudy Host')}
            value={server.pcloudy.hostname}
            onChange={(e) => setServerParam('hostname', e.target.value)}
          />
        </Form.Item>
      </Col>
      <Col span={8}>
        <Form.Item>
          <Input
            id="username"
            type={INPUT.TEXT}
            placeholder={pcloudyUsernamePlaceholder}
            addonBefore={t('Pcloudy User Name')}
            value={server.pcloudy.username}
            onChange={(e) => setServerParam('username', e.target.value)}
          />
        </Form.Item>
      </Col>
      <Col span={8}>
        <Form.Item>
          <Input
            id="accessKey"
            type={INPUT.PASSWORD}
            placeholder={pcloudyAccessKeyExample}
            addonBefore={t('Pcloudy API Key')}
            value={server.pcloudy.accessKey}
            onChange={(e) => setServerParam('accessKey', e.target.value)}
          />
        </Form.Item>
      </Col>
    </Row>
  </Form>
);

export default ServerTabPcloudy;
