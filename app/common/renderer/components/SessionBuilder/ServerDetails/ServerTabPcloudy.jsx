import {Col, Input, Row, Space} from 'antd';
import {useTranslation} from 'react-i18next';

import {INPUT} from '../../../constants/antd-types.js';
import {PROVIDER_VALUES} from '../../../constants/session-builder.js';

const ServerTabPcloudy = ({server, setServerParam}) => {
  const {t} = useTranslation();
  return (
    <Row gutter={8}>
      <Col span={8}>
        <Space.Compact block>
          <Space.Addon>{t('Pcloudy Host')}</Space.Addon>
          <Input
            id="PcloudyServerHost"
            placeholder={PROVIDER_VALUES.PCLOUDY_HOST}
            value={server.pcloudy.hostname}
            onChange={(e) => setServerParam('hostname', e.target.value)}
          />
        </Space.Compact>
      </Col>
      <Col span={8}>
        <Space.Compact block>
          <Space.Addon>{t('Pcloudy User Name')}</Space.Addon>
          <Input
            id="username"
            type={INPUT.TEXT}
            placeholder={PROVIDER_VALUES.PCLOUDY_USERNAME}
            value={server.pcloudy.username}
            onChange={(e) => setServerParam('username', e.target.value)}
          />
        </Space.Compact>
      </Col>
      <Col span={8}>
        <Space.Compact block>
          <Space.Addon>{t('Pcloudy API Key')}</Space.Addon>
          <Input
            id="accessKey"
            type={INPUT.PASSWORD}
            placeholder={PROVIDER_VALUES.PCLOUDY_ACCESS_KEY}
            value={server.pcloudy.accessKey}
            onChange={(e) => setServerParam('accessKey', e.target.value)}
          />
        </Space.Compact>
      </Col>
    </Row>
  );
};

export default ServerTabPcloudy;
