import React, { Component } from 'react';
import { Form, Input, Row, Col } from 'antd';
import { INPUT } from '../../../../gui-common/components/AntdTypes';

const FormItem = Form.Item;

export default class ServerTabLambdatest extends Component {

  render () {

    const {server, setServerParam, t} = this.props;

    const lambdatestUsernamePlaceholder = process.env.LAMBDATEST_USERNAME ?
      t('usingDataFoundIn', {environmentVariable: 'LAMBDATEST_USERNAME'}) : t('yourUsername');

    const lambdatestAccessKeyPlaceholder = process.env.LAMBDATEST_ACCESS_KEY ?
      t('usingDataFoundIn', {environmentVariable: 'LAMBDATEST_ACCESS_KEY'}) : t('yourAccessKey');

    return <Form>
      <Row gutter={8}>
        <Col span={12}>
          <FormItem>
            <Input id='lambdatestUsername' placeholder={lambdatestUsernamePlaceholder} addonBefore={t('Lambdatest Username')} value={server.lambdatest.username}
              onChange={(e) => setServerParam('username', e.target.value)} />
          </FormItem>
        </Col>
      </Row>
      <Row gutter={8}>
        <Col span={12}>
          <FormItem>
            <Input id='lambdatestPassword' type={INPUT.PASSWORD} placeholder={lambdatestAccessKeyPlaceholder} addonBefore={t('Lambdatest Access Key')}
              value={server.lambdatest.accessKey} onChange={(e) => setServerParam('accessKey', e.target.value)} />
          </FormItem>
        </Col>
      </Row>
    </Form>;
  }
}