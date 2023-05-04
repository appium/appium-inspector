import React, { Component } from 'react';
import { Form, Input, Row, Col } from 'antd';

const FormItem = Form.Item;
export default class ServerTabRobotQA extends Component {
  render () {

    const { server, setServerParam, t } = this.props;

    const placeholder = process.env.ROBOTQA_TOKEN ?
      t('usingDataFoundIn', { environmentVariable: 'ROBOTQA_TOKEN' }) : t('Add your token');

    return <Form>
      <Row gutter={8}>
        <Col span={24}>
          <FormItem>
            <Input id='robotQAToken' placeholder={placeholder} addonBefore={t('RobotQA Token')} value={server.roboticmobi.token} onChange={(e) => setServerParam('token', e.target.value)} />
          </FormItem>
        </Col>
      </Row>
    </Form>;
  }
}
