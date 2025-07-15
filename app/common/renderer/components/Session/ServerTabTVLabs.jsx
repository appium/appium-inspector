import {Col, Form, Input, Row} from 'antd';

import {INPUT} from '../../constants/antd-types';

const tvlabsApiKeyPlaceholder = (t) => {
  if (process.env.TVLABS_API_KEY) {
    return t('usingDataFoundIn', {environmentVariable: 'TVLABS_API_KEY'});
  }
  return t('yourApiKey');
};

const ServerTabTVLabs = ({server, setServerParam, t}) => (
  <Form>
    <Row gutter={8}>
      <Col span={24}>
        <Form.Item>
          <Input
            id="tvlabsApiKey"
            type={INPUT.PASSWORD}
            placeholder={tvlabsApiKeyPlaceholder(t)}
            addonBefore={t('TV Labs API Key')}
            value={server.tvlabs.apiKey}
            onChange={(e) => setServerParam('apiKey', e.target.value)}
          />
        </Form.Item>
      </Col>
    </Row>
  </Form>
);

export default ServerTabTVLabs;
