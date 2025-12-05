import {Checkbox, Col, Flex, Input, Radio, Row, Space} from 'antd';

import {INPUT} from '../../../constants/antd-types.js';
import styles from './ServerDetails.module.css';

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
  <Flex gap="small" vertical>
    <Row gutter={8}>
      <Col span={12}>
        <Space.Compact block>
          <Space.Addon>{t('Sauce Username')}</Space.Addon>
          <Input
            id="sauceUsername"
            placeholder={sauceUsernamePlaceholder(t)}
            value={server.sauce.username}
            onChange={(e) => setServerParam('username', e.target.value)}
          />
        </Space.Compact>
      </Col>
      <Col span={12}>
        <Space.Compact block>
          <Space.Addon>{t('Sauce Access Key')}</Space.Addon>
          <Input
            id="saucePassword"
            type={INPUT.PASSWORD}
            placeholder={sauceAccessKeyPlaceholder(t)}
            value={server.sauce.accessKey}
            onChange={(e) => setServerParam('accessKey', e.target.value)}
          />
        </Space.Compact>
      </Col>
    </Row>
    <Row gutter={8}>
      <Col span={8}>
        <Space.Compact block>
          <Space.Addon>{t('SauceLabs Data Center')}</Space.Addon>
          <Radio.Group
            className={styles.addonDataCenterRadioContainer}
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
        </Space.Compact>
      </Col>
      <Col span={8} align="right">
        <Checkbox
          className={styles.addonCheckbox}
          checked={!!server.sauce.useSCProxy}
          onChange={(e) => setServerParam('useSCProxy', e.target.checked)}
        >
          {t('proxyThroughSC')}
        </Checkbox>
      </Col>
      <Col span={5}>
        <Space.Compact block>
          <Space.Addon>{t('Host')}</Space.Addon>
          <Input
            placeholder={t('localhost')}
            disabled={!server.sauce.useSCProxy}
            value={server.sauce.scHost}
            onChange={(e) => setServerParam('scHost', e.target.value)}
          />
        </Space.Compact>
      </Col>
      <Col span={3}>
        <Space.Compact block>
          <Space.Addon>{t('Port')}</Space.Addon>
          <Input
            placeholder={4445}
            disabled={!server.sauce.useSCProxy}
            value={server.sauce.scPort}
            onChange={(e) => setServerParam('scPort', e.target.value)}
          />
        </Space.Compact>
      </Col>
    </Row>
  </Flex>
);

export default ServerTabSauce;
