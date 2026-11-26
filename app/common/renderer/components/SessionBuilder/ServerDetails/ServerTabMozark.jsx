import {Input, Space} from 'antd';
import {useTranslation} from 'react-i18next';

import {INPUT} from '../../../constants/antd-types.js';

import styles from './ServerDetails.module.css';

const placeholder = (t, envVar, fallbackKey) =>
  process.env[envVar] ? t('usingDataFoundIn', {environmentVariable: envVar}) : t(fallbackKey);

const ServerTabMozark = ({server, setServerParam}) => {
  const {t} = useTranslation();
  return (
    <div className={styles.serverDetailRow}>
      <div className={styles.serverInputField300px}>
        <Space.Compact block>
          <Space.Addon>{t('Mozark Username')}</Space.Addon>
          <Input
            id="mozarkUsername"
            placeholder={placeholder(t, 'MOZARK_USERNAME', 'yourUsername')}
            value={server.mozark.username}
            onChange={(e) => setServerParam('username', e.target.value)}
          />
        </Space.Compact>
      </div>
      <div className={styles.serverInputField300px}>
        <Space.Compact block>
          <Space.Addon>{t('Mozark API Key')}</Space.Addon>
          <Input
            id="mozarkApiKey"
            type={INPUT.PASSWORD}
            placeholder={placeholder(t, 'MOZARK_API_KEY', 'yourApiKey')}
            value={server.mozark.apiKey}
            onChange={(e) => setServerParam('apiKey', e.target.value)}
          />
        </Space.Compact>
      </div>
      <div className={styles.serverInputField300px}>
        <Space.Compact block>
          <Space.Addon>{t('Mozark Token')}</Space.Addon>
          <Input
            id="mozarkToken"
            type={INPUT.PASSWORD}
            placeholder={placeholder(t, 'MOZARK_TOKEN', 'Add your token')}
            value={server.mozark.token}
            onChange={(e) => setServerParam('token', e.target.value)}
          />
        </Space.Compact>
      </div>
    </div>
  );
};

export default ServerTabMozark;
