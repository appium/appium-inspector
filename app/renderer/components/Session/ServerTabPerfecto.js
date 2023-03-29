import React, { Component } from 'react';
import { Form, Row, Col, Input, Checkbox } from 'antd';
import SessionStyles from './Session.css';

const FormItem = Form.Item;

export default class ServerTabPerfecto extends Component {

  render () {

    const {server, setServerParam, t} = this.props;

    const cloudPerfectoUrl = 'cloud.Perfectomobile.com';

    const perfectoTokenPlaceholder = process.env.PERFECTO_TOKEN ?
      t('usingDataFoundIn', {environmentVariable: 'PERFECTO_TOKEN'}) : t('Add your token');

    const portPlaceholder = server.perfecto.ssl ? '443' : '80';

    return <Form>
      <Row gutter={8}>
        <Col span={9}>
          <FormItem>
            <Input className={SessionStyles.customServerInputLeft} id='PerfectoServerHost' placeholder={cloudPerfectoUrl} addonBefore={t('Perfecto Host')}
              value={server.perfecto.hostname} onChange={(e) => setServerParam('hostname', e.target.value)} />
          </FormItem>
        </Col>
        <Col span={4}>
          <FormItem>
            <Input id='PerfectoPort' placeholder={portPlaceholder} addonBefore={t('Perfecto Port')} value={server.perfecto.port}
              onChange={(e) => setServerParam('port', e.target.value)} />
          </FormItem>
        </Col>
        <Col span={9}>
          <FormItem>
            <Input id='token' placeholder={perfectoTokenPlaceholder} addonBefore={t('Perfecto Token')} value={server.perfecto.token} onChange={(e) => setServerParam('token', e.target.value)} />
          </FormItem>
        </Col>
        <Col span={2}>
          <FormItem>
            <Checkbox checked={!!server.perfecto.ssl} onChange={(e) => setServerParam('ssl', e.target.checked)}> {'SSL'}</Checkbox>
          </FormItem>
        </Col>
      </Row>
    </Form>;
  }
}
