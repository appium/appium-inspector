import {Col, Input, Row, Space} from 'antd';
import {useTranslation} from 'react-i18next';

import builderStyles from '../SessionBuilder.module.css';

const ServerTabAstrofarm = ({server, setServerParam}) => {
  const {t} = useTranslation();
  return (
    <Row gutter={8}>
      <Col span={24}>
        <Space.Compact block>
          <Space.Addon>{t('serverTabAstrofarmWebDriverURL')}</Space.Addon>
          <Input
            id="astrofarmServerHost"
            placeholder="https://astrofarm-domain/d/appium/your-authentication-token"
            value={server.astrofarm.webDriverUrl}
            onChange={(e) => setServerParam('webDriverUrl', e.target.value)}
          />
        </Space.Compact>
        <p className={builderStyles.localDesc}>{t('sessionAstrofarmWebDriverURLDescription')}</p>
      </Col>
    </Row>
  );
};

export default ServerTabAstrofarm;