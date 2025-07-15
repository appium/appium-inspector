import {Col, Form, Input, Row} from 'antd';

import {INPUT} from '../../constants/antd-types';

const bitbarApiKeyPlaceholder = (t) => {
  if (process.env.BITBAR_API_KEY) {
    return t('usingDataFoundIn', {environmentVariable: 'BITBAR_API_KEY'});
  }
  return t('yourApiKey');
};

const ServerTabBitbar = ({server, setServerParam, t}) => (
  <Form>
    <Row gutter={8}>
      <Col span={24}>
        <Form.Item>
          <Input
            id="bitbarApiKey"
            type={INPUT.PASSWORD}
            placeholder={bitbarApiKeyPlaceholder(t)}
            addonBefore={t('Bitbar API Key')}
            value={server.bitbar.apiKey}
            onChange={(e) => setServerParam('apiKey', e.target.value)}
          />
        </Form.Item>
      </Col>
    </Row>
  </Form>
);

export default ServerTabBitbar;
