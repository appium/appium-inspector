import {Col, Form, Input, Row} from 'antd';
import React from 'react';

const robotQATokenPlaceholder = (t) => {
  if (process.env.ROBOTQA_TOKEN) {
    return t('usingDataFoundIn', {environmentVariable: 'ROBOTQA_TOKEN'});
  }
  return t('Add your token');
};

const ServerTabRobotQA = ({server, setServerParam, t}) => (
  <Form>
    <Row gutter={8}>
      <Col span={24}>
        <Form.Item>
          <Input
            id="robotQAToken"
            placeholder={robotQATokenPlaceholder(t)}
            addonBefore={t('RobotQA Token')}
            value={server.roboticmobi.token}
            onChange={(e) => setServerParam('token', e.target.value)}
          />
        </Form.Item>
      </Col>
    </Row>
  </Form>
);

export default ServerTabRobotQA;
