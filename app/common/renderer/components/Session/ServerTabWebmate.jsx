import {Checkbox, Col, Form, Input, Row} from 'antd';

import {INPUT} from '../../constants/antd-types.js';

const ServerTabWebmate = ({server, setServerParam, t}) => (
  <Form>
    <Row gutter={8}>
      <Col span={12}>
        <Form.Item>
          <Input
            type={INPUT.PASSWORD}
            placeholder={
              process.env.WEBMATE_APIKEY
                ? t('usingDataFoundIn', {environmentVariable: 'WEBMATE_APIKEY'})
                : t('yourApiKey')
            }
            addonBefore={t('webmateApiKey')}
            value={server.webmate.apiKey}
            onChange={(e) => setServerParam('apiKey', e.target.value)}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item>
          <Input
            placeholder={
              process.env.WEBMATE_PROJECT
                ? t('usingDataFoundIn', {environmentVariable: 'WEBMATE_PROJECT'})
                : t('yourProjectId')
            }
            addonBefore={t('webmateProjectId')}
            value={server.webmate.projectId}
            onChange={(e) => setServerParam('projectId', e.target.value)}
          />
        </Form.Item>
      </Col>
    </Row>
    <Row gutter={8}>
      <Col span={12} align="right">
        <Form.Item>
          <Checkbox
            checked={!!server.webmate.useCustomHost}
            onChange={(e) => setServerParam('useCustomHost', e.target.checked)}
          >
            {t('specifyWebmateHostExplicitly')}
          </Checkbox>
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item>
          <Input
            placeholder={
              process.env.WEBMATE_HOST
                ? t('usingDataFoundIn', {environmentVariable: 'WEBMATE_HOST'})
                : 'selenium.webmate.io'
            }
            addonBefore={t('webmateHost')}
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
