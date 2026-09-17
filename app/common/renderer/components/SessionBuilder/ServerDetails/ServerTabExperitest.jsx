import {Input, Space} from 'antd';
import {useTranslation} from 'react-i18next';

import {PROVIDER_VALUES} from '../../../constants/session-builder.js';

import styles from './ServerDetails.module.css';

const ServerTabExperitest = ({server, setServerParam}) => {
  const {t} = useTranslation();
  return (
    <div className={styles.serverDetailRow}>
      <div className={styles.serverInputField300px}>
        <Space.Compact block>
          <Space.Addon>{t('experitestUrl')}</Space.Addon>
          <Input
            id="ExperitestServerUrl"
            placeholder={PROVIDER_VALUES.EXPERITEST_URL}
            value={server.experitest.url}
            onChange={(evt) => setServerParam('url', evt.target.value)}
          />
        </Space.Compact>
      </div>
      <div className={styles.serverInputField300px}>
        <Space.Compact block>
          <Space.Addon>{t('experitestAccessKey')}</Space.Addon>
          <Input
            id="ExperitestServerAccessKey"
            placeholder={PROVIDER_VALUES.EXPERITEST_ACCESS_KEY}
            value={server.experitest.accessKey}
            onChange={(evt) => setServerParam('accessKey', evt.target.value)}
          />
        </Space.Compact>
      </div>
    </div>
  );
};

export default ServerTabExperitest;
