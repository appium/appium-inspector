import {Col, Form, Input, Row} from 'antd';

import {PROVIDER_VALUES} from '../../../constants/session-builder.js';

const ServerTabExperitest = ({server, setServerParam, t}) => (
  <Form>
    <Row gutter={8}>
      <Col span={12}>
        <Form.Item>
          <Input
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
