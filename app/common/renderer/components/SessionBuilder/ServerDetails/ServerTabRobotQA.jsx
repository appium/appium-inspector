import {Col, Input, Row, Space} from 'antd';

const robotQATokenPlaceholder = (t) => {
  if (process.env.ROBOTQA_TOKEN) {
    return t('usingDataFoundIn', {environmentVariable: 'ROBOTQA_TOKEN'});
  }
  return t('Add your token');
};

const ServerTabRobotQA = ({server, setServerParam, t}) => (
  <Row gutter={8}>
    <Col span={24}>
      <Space.Compact block>
        <Space.Addon>{t('RobotQA Token')}</Space.Addon>
        <Input
          id="robotQAToken"
          placeholder={robotQATokenPlaceholder(t)}
          value={server.roboticmobi.token}
          onChange={(e) => setServerParam('token', e.target.value)}
        />
      </Space.Compact>
    </Col>
  </Row>
);

export default ServerTabRobotQA;
