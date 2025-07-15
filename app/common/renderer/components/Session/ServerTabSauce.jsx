import {Checkbox, Col, Form, Input, Radio, Row} from 'antd';

import {INPUT} from '../../constants/antd-types';
import SessionStyles from './Session.module.css';

const sauceUsernamePlaceholder = (t) => {
  if (process.env.SAUCE_USERNAME) {
    return t('usingDataFoundIn', {environmentVariable: 'SAUCE_USERNAME'});
  }
  return t('yourUsername');
};

const sauceAccessKeyPlaceholder = (t) => {
  if (process.env.SAUCE_ACCESS_KEY) {
    return t('usingDataFoundIn', {environmentVariable: 'SAUCE_ACCESS_KEY'});
  }
  return t('yourAccessKey');
};

const ServerTabSauce = ({server, setServerParam, t}) => (
  <Form>
    <Row gutter={8}>
      <Col span={12}>
        <Form.Item>
          <Input
            id="sauceUsername"
            placeholder={sauceUsernamePlaceholder(t)}
            addonBefore={t('Sauce Username')}
            value={server.sauce.username}
            onChange={(e) => setServerParam('username', e.target.value)}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item>
          <Input
            id="saucePassword"
            type={INPUT.PASSWORD}
            placeholder={sauceAccessKeyPlaceholder(t)}
            addonBefore={t('Sauce Access Key')}
            value={server.sauce.accessKey}
            onChange={(e) => setServerParam('accessKey', e.target.value)}
          />
        </Form.Item>
      </Col>
    </Row>
    <Row gutter={8}>
      <Col span={8}>
        <Form.Item>
          <div className={['ant-input-group-addon', SessionStyles.addonDataCenter].join(' ')}>
            {t('SauceLabs Data Center')}
          </div>
          <Radio.Group
            className={[
              SessionStyles.inputDataCenter,
              SessionStyles.addonDataCenterRadioContainer,
            ].join(' ')}
            buttonStyle="solid"
            defaultValue="us-west-1"
            id="sauceObjectDataCenter"
            value={server.sauce.dataCenter}
            onChange={(e) => setServerParam('dataCenter', e.target.value)}
          >
            <Radio value="us-west-1">{t('US-West')}</Radio>
            <Radio value="us-east-4">{t('US-East')}</Radio>
            <Radio value="eu-central-1">{t('EU-Central')}</Radio>
          </Radio.Group>
        </Form.Item>
      </Col>
      <Col span={8} align="right">
        <Form.Item>
          <Checkbox
            checked={!!server.sauce.useSCProxy}
            onChange={(e) => setServerParam('useSCProxy', e.target.checked)}
          >
            {t('proxyThroughSC')}
          </Checkbox>
        </Form.Item>
      </Col>
      <Col span={5}>
        <Form.Item>
          <Input
            addonBefore={t('Host')}
            placeholder={t('localhost')}
            disabled={!server.sauce.useSCProxy}
            value={server.sauce.scHost}
            onChange={(e) => setServerParam('scHost', e.target.value)}
          />
        </Form.Item>
      </Col>
      <Col span={3}>
        <Form.Item>
          <Input
            addonBefore={t('Port')}
            placeholder={4445}
            disabled={!server.sauce.useSCProxy}
            value={server.sauce.scPort}
            onChange={(e) => setServerParam('scPort', e.target.value)}
          />
        </Form.Item>
      </Col>
    </Row>
  </Form>
);

export default ServerTabSauce;
