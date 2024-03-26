import {Col, Form, Input, Row} from 'antd';
import React from 'react';

import {INPUT} from '../../constants/antd-types';

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

const ServerTabMobitru = ({server, setServerParam, t}) => (
  <Form>
    <Row gutter={8}>
      <Col span={24}>
        <Form.Item>
          <Input
            id="mobitruWebDriverUrl"
            placeholder={mobitrWebDriverUrlPlaceholder(t)}
            addonBefore={t('Mobitru WebDriver URL')}
            value={server.mobitru.webDriverUrl}
            onChange={(e) => setServerParam('webDriverUrl', e.target.value)}
          />
        </Form.Item>
      </Col>
    </Row>
    <Row gutter={8}>
      <Col span={12}>
        <Form.Item>
          <Input
            id="mobitruBillingUnit"
            placeholder={mobitruBillingUnitPlaceholder(t)}
            addonBefore={t('Mobitru Billing Unit')}
            value={server.mobitru.username}
            onChange={(e) => setServerParam('username', e.target.value)}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item>
          <Input
            id="mobitruAccessKey"
            type={INPUT.PASSWORD}
            placeholder={mobitruAccessKeyPlaceholder(t)}
            addonBefore={t('Mobitru Access Key')}
            value={server.mobitru.accessKey}
            onChange={(e) => setServerParam('accessKey', e.target.value)}
          />
        </Form.Item>
      </Col>
    </Row>
  </Form>
);

export default ServerTabMobitru;
