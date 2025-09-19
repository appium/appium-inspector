import {Col, Form, Input, Row} from 'antd';

import {INPUT} from '../../../constants/antd-types.js';

// Placeholders using environment variables if available

const fireflinkDeviceFarmDomainPlaceholder = (t) => {
  if (process.env.FIREFLINKDEVICEFARM_DOMAIN) {
    return t('usingDataFoundIn', {environmentVariable: 'FIREFLINKDEVICEFARM_DOMAIN'});
  }
  return t('yourFireflinkDevicefarmDomain');
};
const fireflinkDeviceFarmAccessKeyPlaceholder = (t) => {
  if (process.env.FIREFLINKDEVICEFARM_ACCESS_KEY) {
    return t('usingDataFoundIn', {environmentVariable: 'FIREFLINKDEVICEFARM_ACCESS_KEY'});
  }
  return t('yourAccessKey');
};

const fireflinkDeviceFarmLicenseIdPlaceholder = (t) => {
  if (process.env.FIREFLINKDEVICEFARM_LICENSE_ID) {
    return t('usingDataFoundIn', {environmentVariable: 'FIREFLINKDEVICEFARM_LICENSE_ID'});
  }
  return t('yourLicenseId');
};

const fireflinkDeviceFarmprojectNamePlaceholder = (t) => {
  if (process.env.FIREFLINKDEVICEFARM_PROJECT_ID) {
    return t('usingDataFoundIn', {environmentVariable: 'FIREFLINKDEVICEFARM_PROJECT_ID'});
  }
  return t('yourProjectName');
};

const ServerTabFireflinkDeviceFarm = ({server, setServerParam, t}) => (
  <Form>
    <Row gutter={8}>
      <Col span={12}>
        <Form.Item>
          <Input
            id="fireflinkDeviceFarmDomain"
            placeholder={fireflinkDeviceFarmDomainPlaceholder(t)}
            addonBefore={t('FireflinkDeviceFarm Domain')}
            value={server.fireflinkdevicefarm.host}
            onChange={(e) => setServerParam('host', e.target.value)}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item>
          <Input
            id="fireflinkDeviceFarmAccessKey"
            type={INPUT.PASSWORD}
            placeholder={fireflinkDeviceFarmAccessKeyPlaceholder(t)}
            addonBefore={t('FireflinkDeviceFarm Access Key')}
            value={server.fireflinkdevicefarm.accessKey}
            onChange={(e) => setServerParam('accessKey', e.target.value)}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item>
          <Input
            id="fireflinkDeviceFarmLicenseId"
            placeholder={fireflinkDeviceFarmLicenseIdPlaceholder(t)}
            addonBefore={t('FireflinkDeviceFarm License ID')}
            value={server.fireflinkdevicefarm.licenseId}
            onChange={(e) => setServerParam('licenseId', e.target.value)}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item>
          <Input
            id="fireflinkDeviceFarmprojectName"
            placeholder={fireflinkDeviceFarmprojectNamePlaceholder(t)}
            addonBefore={t('FireflinkDeviceFarm Project Name')}
            value={server.fireflinkdevicefarm.projectName}
            onChange={(e) => setServerParam('projectName', e.target.value)}
          />
        </Form.Item>
      </Col>
    </Row>
  </Form>
);

export default ServerTabFireflinkDeviceFarm;
