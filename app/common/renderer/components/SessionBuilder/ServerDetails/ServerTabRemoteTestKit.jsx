import {Input, Space} from 'antd';
import {useTranslation} from 'react-i18next';

import {INPUT} from '../../../constants/antd-types.js';

const ServerTabRemoteTestkit = ({server, setServerParam}) => {
  const {t} = useTranslation();
  return (
    <Space.Compact block>
      <Space.Addon>{t('RemoteTestKit AccessToken')}</Space.Addon>
      <Input
        id="remoteTestKitAccessToken"
        type={INPUT.PASSWORD}
        value={server.remotetestkit.token}
        onChange={(e) => setServerParam('token', e.target.value)}
      />
    </Space.Compact>
  );
};

export default ServerTabRemoteTestkit;
