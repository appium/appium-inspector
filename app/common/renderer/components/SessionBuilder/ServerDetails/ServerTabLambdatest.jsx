import {Col, Input, Row, Space} from 'antd';

import {INPUT} from '../../../constants/antd-types.js';

const lambdatestUsernamePlaceholder = (t) => {
  if (process.env.LAMBDATEST_USERNAME) {
    return t('usingDataFoundIn', {environmentVariable: 'LAMBDATEST_USERNAME'});
  }
  return t('yourUsername');
};

const lambdatestAccessKeyPlaceholder = (t) => {
  if (process.env.LAMBDATEST_ACCESS_KEY) {
    return t('usingDataFoundIn', {environmentVariable: 'LAMBDATEST_ACCESS_KEY'});
  }
  return t('yourAccessKey');
};

const ServerTabLambdatest = ({server, setServerParam, t}) => (
  <Row gutter={8}>
    <Col span={12}>
      <Space.Compact block>
        <Space.Addon>{t('LambdaTest Username')}</Space.Addon>
        <Input
          id="lambdatestUsername"
          placeholder={lambdatestUsernamePlaceholder(t)}
          value={server.lambdatest.username}
          onChange={(e) => setServerParam('username', e.target.value)}
        />
      </Space.Compact>
    </Col>
    <Col span={12}>
      <Space.Compact block>
        <Space.Addon>{t('LambdaTest Access Key')}</Space.Addon>
        <Input
          id="lambdatestPassword"
          type={INPUT.PASSWORD}
          placeholder={lambdatestAccessKeyPlaceholder(t)}
          value={server.lambdatest.accessKey}
          onChange={(e) => setServerParam('accessKey', e.target.value)}
        />
      </Space.Compact>
    </Col>
  </Row>
);

export default ServerTabLambdatest;
