import {Input, Space} from 'antd';
import {useTranslation} from 'react-i18next';

import {INPUT} from '../../../constants/antd-types.js';

import styles from './ServerDetails.module.css';

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

const ServerTabFireflinkDeviceFarm = ({server, setServerParam}) => {
  const {t} = useTranslation();
  return (
    <div className={styles.serverDetailRow}>
      <div className={styles.serverInputField400px}>
        <Space.Compact block>
          <Space.Addon>{t('Fireflink DeviceFarm Domain')}</Space.Addon>
          <Input
            id="fireflinkDeviceFarmDomain"
            placeholder={fireflinkDeviceFarmDomainPlaceholder(t)}
            value={server.fireflinkdevicefarm.host}
            onChange={(e) => setServerParam('host', e.target.value)}
          />
        </Space.Compact>
      </div>
      <div className={styles.serverInputField400px}>
        <Space.Compact block>
          <Space.Addon>{t('Fireflink DeviceFarm Access Key')}</Space.Addon>
          <Input
            id="fireflinkDeviceFarmAccessKey"
            type={INPUT.PASSWORD}
            placeholder={fireflinkDeviceFarmAccessKeyPlaceholder(t)}
            value={server.fireflinkdevicefarm.accessKey}
            onChange={(e) => setServerParam('accessKey', e.target.value)}
          />
        </Space.Compact>
      </div>
      <div className={styles.serverInputField400px}>
        <Space.Compact block>
          <Space.Addon>{t('Fireflink DeviceFarm License ID')}</Space.Addon>
          <Input
            id="fireflinkDeviceFarmLicenseId"
            placeholder={fireflinkDeviceFarmLicenseIdPlaceholder(t)}
            value={server.fireflinkdevicefarm.licenseId}
            onChange={(e) => setServerParam('licenseId', e.target.value)}
          />
        </Space.Compact>
      </div>
      <div className={styles.serverInputField400px}>
        <Space.Compact block>
          <Space.Addon>{t('Fireflink DeviceFarm Project Name')}</Space.Addon>
          <Input
            id="fireflinkDeviceFarmprojectName"
            placeholder={fireflinkDeviceFarmprojectNamePlaceholder(t)}
            value={server.fireflinkdevicefarm.projectName}
            onChange={(e) => setServerParam('projectName', e.target.value)}
          />
        </Space.Compact>
      </div>
    </div>
  );
};

export default ServerTabFireflinkDeviceFarm;
