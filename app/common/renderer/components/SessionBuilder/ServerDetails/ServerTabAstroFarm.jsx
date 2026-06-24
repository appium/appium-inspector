import {Col, Input, Row, Space} from 'antd';
import {useTranslation} from 'react-i18next';

import {PROVIDER_VALUES} from '../../../constants/session-builder.js';
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
            placeholder={PROVIDER_VALUES.ASTROFARM_URL}
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
