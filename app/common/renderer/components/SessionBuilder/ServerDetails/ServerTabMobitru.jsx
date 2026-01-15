import {Col, Flex, Input, Row, Space} from 'antd';
import {useTranslation} from 'react-i18next';

import {INPUT} from '../../../constants/antd-types.js';

const mobitrWebDriverUrlPlaceholder = (t) => {
  if (process.env.MOBITRU_WEBDRIVER_URL) {
    return t('usingDataFoundIn', {environmentVariable: 'MOBITRU_WEBDRIVER_URL'});
  }
  return 'https://app.mobitru.com/wd/hub';
};

const mobitruBillingUnitPlaceholder = (t) => {
  if (process.env.MOBITRU_BILLING_UNIT) {
    return t('usingDataFoundIn', {environmentVariable: 'MOBITRU_BILLING_UNIT'});
  }
  return 'personal';
};

const mobitruAccessKeyPlaceholder = (t) => {
  if (process.env.MOBITRU_ACCESS_KEY) {
    return t('usingDataFoundIn', {environmentVariable: 'MOBITRU_ACCESS_KEY'});
  }
  return t('yourAccessKey');
};

const ServerTabMobitru = ({server, setServerParam}) => {
  const {t} = useTranslation();
  return (
    <Flex gap="small" vertical>
      <Row gutter={8}>
        <Col span={24}>
          <Space.Compact block>
            <Space.Addon>{t('Mobitru WebDriver URL')}</Space.Addon>
            <Input
              id="mobitruWebDriverUrl"
              placeholder={mobitrWebDriverUrlPlaceholder(t)}
              value={server.mobitru.webDriverUrl}
              onChange={(e) => setServerParam('webDriverUrl', e.target.value)}
            />
          </Space.Compact>
        </Col>
      </Row>
      <Row gutter={8}>
        <Col span={12}>
          <Space.Compact block>
            <Space.Addon>{t('Mobitru Billing Unit')}</Space.Addon>
            <Input
              id="mobitruBillingUnit"
              placeholder={mobitruBillingUnitPlaceholder(t)}
              value={server.mobitru.username}
              onChange={(e) => setServerParam('username', e.target.value)}
            />
          </Space.Compact>
        </Col>
        <Col span={12}>
          <Space.Compact block>
            <Space.Addon>{t('Mobitru Access Key')}</Space.Addon>
            <Input
              id="mobitruAccessKey"
              type={INPUT.PASSWORD}
              placeholder={mobitruAccessKeyPlaceholder(t)}
              value={server.mobitru.accessKey}
              onChange={(e) => setServerParam('accessKey', e.target.value)}
            />
          </Space.Compact>
        </Col>
      </Row>
    </Flex>
  );
};

export default ServerTabMobitru;
