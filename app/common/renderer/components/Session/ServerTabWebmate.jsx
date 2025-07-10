import {Checkbox, Col, Form, Input, Row} from 'antd';

import {INPUT} from '../../constants/antd-types.js';

const ServerTabWebmate = ({server, setServerParam, t}) => (
  <Form>
    <Row gutter={8}>
      <Col span={24}>
        <Form.Item>
          <Input
            type={INPUT.PASSWORD}
            placeholder={
              process.env.WEBMATE_API_KEY
                ? t('usingDataFoundIn', {environmentVariable: 'WEBMATE_API_KEY'})
                : t('yourAccessKey')
            }
            addonBefore={'webmate API key'}
            value={server.webmate.apiKey}
            onChange={(e) => setServerParam('apiKey', e.target.value)}
          />
        </Form.Item>
      </Col>
    </Row>
    <Row gutter={8}>
      <Col span={24}>
        <Form.Item>
          <Input
            placeholder={
              process.env.WEBMATE_PROJECT
                ? t('usingDataFoundIn', {environmentVariable: 'WEBMATE_PROJECT'})
                : 'Your project id'
            }
            addonBefore={'webmate project id'}
            value={server.webmate.projectId}
            onChange={(e) => setServerParam('projectId', e.target.value)}
          />
        </Form.Item>
      </Col>
    </Row>
    <Row gutter={8}>
      <Col span={8}>
        <Form.Item>
          <Checkbox
            checked={!!server.webmate.useCustomHost}
            onChange={(e) => setServerParam('useCustomHost', e.target.checked)}
          >Specify webmate host explicitly</Checkbox>
        </Form.Item>
      </Col>
      <Col span={16}>
        <Form.Item>
          <Input
            placeholder={
              process.env.WEBMATE_HOST
                ? t('usingDataFoundIn', {environmentVariable: 'WEBMATE_HOST'})
                : 'selenium.webmate.io'
            }
            addonBefore={'webmate host'}
            disabled={!server.webmate.useCustomHost}
            value={server.webmate.seleniumHost}
            onChange={(e) => setServerParam('seleniumHost', e.target.value)}
          />
        </Form.Item>
      </Col>
    </Row>
  </Form>
);

export default ServerTabWebmate;
