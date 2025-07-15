import {Col, Form, Input, Row} from 'antd';

import {INPUT} from '../../constants/antd-types';
import {PROVIDER_VALUES} from '../../constants/session-builder';
import SessionStyles from './Session.module.css';

const ServerTabPcloudy = ({server, setServerParam, t}) => (
  <Form>
    <Row gutter={8}>
      <Col span={8}>
        <Form.Item>
          <Input
            className={SessionStyles.customServerInputLeft}
            id="PcloudyServerHost"
            placeholder={PROVIDER_VALUES.PCLOUDY_HOST}
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
            placeholder={PROVIDER_VALUES.PCLOUDY_USERNAME}
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
            placeholder={PROVIDER_VALUES.PCLOUDY_ACCESS_KEY}
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
