import {Checkbox, Col, Input, Row, Space} from 'antd';
import {useTranslation} from 'react-i18next';

import {DEFAULT_SERVER_PROPS} from '../../../constants/webdriver.js';
import styles from './ServerDetails.module.css';

const ServerTabCustom = ({server, setServerParam, t}) => {
  const {t} = useTranslation();
  return (
    <Row gutter={8}>
      <Col span={9}>
        <Space.Compact block>
          <Space.Addon>{t('Remote Host')}</Space.Addon>
          <Input
            id="customServerHost"
            placeholder={DEFAULT_SERVER_PROPS.hostname}
            value={server.remote.hostname}
            onChange={(e) => setServerParam('hostname', e.target.value)}
          />
        </Space.Compact>
      </Col>
      <Col span={4}>
        <Space.Compact block>
          <Space.Addon>{t('Remote Port')}</Space.Addon>
          <Input
            id="customServerPort"
            placeholder={DEFAULT_SERVER_PROPS.port}
            value={server.remote.port}
            onChange={(e) => setServerParam('port', e.target.value)}
          />
        </Space.Compact>
      </Col>
      <Col span={9}>
        <Space.Compact block>
          <Space.Addon>{t('Remote Path')}</Space.Addon>
          <Input
            id="customServerPath"
            placeholder={DEFAULT_SERVER_PROPS.path}
            value={server.remote.path}
            onChange={(e) => setServerParam('path', e.target.value)}
          />
        </Space.Compact>
      </Col>
      <Col span={2}>
        <Checkbox
          className={styles.addonCheckbox}
          id="customServerSSL"
          checked={!!server.remote.ssl}
          value={server.remote.ssl}
          onChange={(e) => setServerParam('ssl', e.target.checked)}
        >
          {t('SSL')}
        </Checkbox>
      </Col>
    </Row>
  );
};

export default ServerTabCustom;
