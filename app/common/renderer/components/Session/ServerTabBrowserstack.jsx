import {Col, Form, Input, Row} from 'antd';

import {INPUT} from '../../constants/antd-types';

const browserstackUsernamePlaceholder = (t) => {
  if (process.env.BROWSERSTACK_USERNAME) {
    return t('usingDataFoundIn', {environmentVariable: 'BROWSERSTACK_USERNAME'});
  }
  return t('yourUsername');
};

const browserstackAccessKeyPlaceholder = (t) => {
  if (process.env.BROWSERSTACK_ACCESS_KEY) {
    return t('usingDataFoundIn', {environmentVariable: 'BROWSERSTACK_ACCESS_KEY'});
  }
  return t('yourAccessKey');
};

const ServerTabBrowserstack = ({server, setServerParam, t}) => (
  <Form>
    <Row gutter={8}>
      <Col span={12}>
        <Form.Item>
          <Input
            id="browserstackUsername"
            placeholder={browserstackUsernamePlaceholder(t)}
            addonBefore={t('BrowserStack Username')}
            value={server.browserstack.username}
            onChange={(e) => setServerParam('username', e.target.value)}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item>
          <Input
            id="browserstackPassword"
            type={INPUT.PASSWORD}
            placeholder={browserstackAccessKeyPlaceholder(t)}
            addonBefore={t('BrowserStack Access Key')}
            value={server.browserstack.accessKey}
            onChange={(e) => setServerParam('accessKey', e.target.value)}
          />
        </Form.Item>
      </Col>
    </Row>
  </Form>
);

export default ServerTabBrowserstack;
