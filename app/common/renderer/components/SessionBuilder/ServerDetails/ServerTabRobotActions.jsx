import {Col, Input, Row, Space} from 'antd';
import {useTranslation} from 'react-i18next';

import {INPUT} from '../../../constants/antd-types.js';

const robotActionsTokenPlaceholder = (t) => {
  if (process.env.ROBOTACTIONS_TOKEN) {
    return t('usingDataFoundIn', {environmentVariable: 'ROBOTACTIONS_TOKEN'});
  }
  return t('yourApiKey');
};

const ServerTabRobotActions = ({server, setServerParam}) => {
  const {t} = useTranslation();
  return (
    <Space direction="vertical" style={{width: '100%'}}>
      <Row gutter={8}>
        <Col span={24}>
          <Space.Compact block>
            <Space.Addon>{t('RobotActions Host')}</Space.Addon>
            <Input
              id="robotActionsHost"
              placeholder="XXXXX.robotactions.com"
              value={server.robotactions.host}
              onChange={(e) => setServerParam('host', e.target.value)}
            />
          </Space.Compact>
        </Col>
      </Row>
      <Row gutter={8}>
        <Col span={24}>
          <Space.Compact block>
            <Space.Addon>{t('RobotActions Token')}</Space.Addon>
            <Input
              id="robotActionsToken"
              type={INPUT.PASSWORD}
              placeholder={robotActionsTokenPlaceholder(t)}
              value={server.robotactions.token}
              onChange={(e) => setServerParam('token', e.target.value)}
            />
          </Space.Compact>
        </Col>
      </Row>
    </Space>
  );
};

export default ServerTabRobotActions;
