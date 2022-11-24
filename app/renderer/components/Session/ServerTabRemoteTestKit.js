import React, { Component } from 'react';
import { Form, Row, Col, Input } from 'antd';
import { INPUT } from '../../../../gui-common/components/AntdTypes';

const FormItem = Form.Item;

export default class ServerTabRemoteTestkit extends Component {

  render () {

    const {server, setServerParam, t} = this.props;

    return <Form>
      <Row gutter={8}>
        <Col span={18}>
          <FormItem>
            <Input id='remoteTestKitAccessToken' type={INPUT.PASSWORD} addonBefore={t('RemoteTestKit AccessToken')} value={server.remotetestkit.token}
              onChange={(e) => setServerParam('token', e.target.value)} />
          </FormItem>
        </Col>
      </Row>
    </Form>;
  }
}
