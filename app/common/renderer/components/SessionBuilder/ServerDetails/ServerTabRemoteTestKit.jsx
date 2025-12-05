import {Col, Input, Row, Space} from 'antd';

import {INPUT} from '../../../constants/antd-types.js';

const ServerTabRemoteTestkit = ({server, setServerParam, t}) => (
  <Row gutter={8}>
    <Col span={24}>
      <Space.Compact block>
        <Space.Addon>{t('RemoteTestKit AccessToken')}</Space.Addon>
        <Input
          id="remoteTestKitAccessToken"
          type={INPUT.PASSWORD}
          value={server.remotetestkit.token}
          onChange={(e) => setServerParam('token', e.target.value)}
        />
      </Space.Compact>
    </Col>
  </Row>
);

export default ServerTabRemoteTestkit;
