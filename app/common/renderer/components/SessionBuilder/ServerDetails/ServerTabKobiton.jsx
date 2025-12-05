import {Col, Input, Row, Space} from 'antd';

import {INPUT} from '../../../constants/antd-types.js';

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
  <Row gutter={8}>
    <Col span={12}>
      <Space.Compact block>
        <Space.Addon>{t('Your Kobiton Username')}</Space.Addon>
        <Input
          id="kobitonUsername"
          placeholder={kobitonUsernamePlaceholder(t)}
          value={server.kobiton.username}
          onChange={(e) => setServerParam('username', e.target.value)}
        />
      </Space.Compact>
    </Col>
    <Col span={12}>
      <Space.Compact block>
        <Space.Addon>{t('Kobiton Access Key')}</Space.Addon>
        <Input
          id="kobitonAccessKey"
          type={INPUT.PASSWORD}
          placeholder={kobitonAccessKeyPlaceholder(t)}
          value={server.kobiton.accessKey}
          onChange={(e) => setServerParam('accessKey', e.target.value)}
        />
      </Space.Compact>
    </Col>
  </Row>
);

export default ServerTabKobiton;
