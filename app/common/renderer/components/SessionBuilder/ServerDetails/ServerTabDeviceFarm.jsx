import {Col, Form, Input, Row} from 'antd';

import {INPUT} from '../../../constants/antd-types.js';

// Placeholders using environment variables if available

const deviceFarmDomainPlaceholder = (t) => {
  if (process.env.DEVICEFARM_DOMAIN) {
    return t('usingDataFoundIn', {environmentVariable: 'DEVICEFARM_DOMAIN'});
  }
  return t('Your DeviceFarm Domain (e.g., cloud.fireflink.com)');
};
const deviceFarmAccessKeyPlaceholder = (t) => {
  if (process.env.DEVICEFARM_ACCESS_KEY) {
    return t('usingDataFoundIn', {environmentVariable: 'DEVICEFARM_ACCESS_KEY'});
  }
  return t('yourAccessKey');
};

const deviceFarmLicenseIdPlaceholder = (t) => {
  if (process.env.DEVICEFARM_LICENSE_ID) {
    return t('usingDataFoundIn', {environmentVariable: 'DEVICEFARM_LICENSE_ID'});
  }
  return t('Your LicenseId');
};

const deviceFarmprojectNamePlaceholder = (t) => {
  if (process.env.DEVICEFARM_PROJECT_ID) {
    return t('usingDataFoundIn', {environmentVariable: 'DEVICEFARM_PROJECT_ID'});
  }
  return t('Your Project Name');
};

const ServerTabDeviceFarm = ({server, setServerParam, t}) => (
  <Form>
    <Row gutter={8}>
      <Col span={8}>
        <Form.Item>
          <Input
            id="deviceFarmDomain"
            placeholder={deviceFarmDomainPlaceholder(t)}
            addonBefore={t('DeviceFarm Domain')}
            value={server.devicefarm.host}
            onChange={(e) => setServerParam('host', e.target.value)}
          />
        </Form.Item>
      </Col>
      <Col span={8}>
        <Form.Item>
          <Input
            id="deviceFarmAccessKey"
            type={INPUT.PASSWORD}
            placeholder={deviceFarmAccessKeyPlaceholder(t)}
            addonBefore={t('DeviceFarm Access Key')}
            value={server.devicefarm.accessKey}
            onChange={(e) => setServerParam('accessKey', e.target.value)}
          />
        </Form.Item>
      </Col>
      <Col span={8}>
        <Form.Item>
          <Input
            id="deviceFarmLicenseId"
            placeholder={deviceFarmLicenseIdPlaceholder(t)}
            addonBefore={t('DeviceFarm License ID')}
            value={server.devicefarm.licenseId}
            onChange={(e) => setServerParam('licenseId', e.target.value)}
          />
        </Form.Item>
      </Col>
      <Col span={8}>
        <Form.Item>
          <Input
            id="deviceFarmprojectName"
            placeholder={deviceFarmprojectNamePlaceholder(t)}
            addonBefore={t('DeviceFarm Project Name')}
            value={server.devicefarm.projectName}
            onChange={(e) => setServerParam('projectName', e.target.value)}
          />
        </Form.Item>
      </Col>
    </Row>
  </Form>
);

export default ServerTabDeviceFarm;
