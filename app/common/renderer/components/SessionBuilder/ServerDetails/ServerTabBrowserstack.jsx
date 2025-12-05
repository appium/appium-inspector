import {Col, Input, Row, Space} from 'antd';

import {INPUT} from '../../../constants/antd-types.js';

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
  <Row gutter={8}>
    <Col span={12}>
      <Space.Compact block>
        <Space.Addon>{t('BrowserStack Username')}</Space.Addon>
        <Input
          id="browserstackUsername"
          placeholder={browserstackUsernamePlaceholder(t)}
          value={server.browserstack.username}
          onChange={(e) => setServerParam('username', e.target.value)}
        />
      </Space.Compact>
    </Col>
    <Col span={12}>
      <Space.Compact block>
        <Space.Addon>{t('BrowserStack Access Key')}</Space.Addon>
        <Input
          id="browserstackPassword"
          type={INPUT.PASSWORD}
          placeholder={browserstackAccessKeyPlaceholder(t)}
          value={server.browserstack.accessKey}
          onChange={(e) => setServerParam('accessKey', e.target.value)}
        />
      </Space.Compact>
    </Col>
  </Row>
);

export default ServerTabBrowserstack;
