import {Col, Input, Row, Space} from 'antd';
import {useTranslation} from 'react-i18next';

import {INPUT} from '../../../constants/antd-types.js';

const ServerTabRemoteTestkit = ({server, setServerParam}) => {
  const {t} = useTranslation();
  return (
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
};

export default ServerTabRemoteTestkit;
