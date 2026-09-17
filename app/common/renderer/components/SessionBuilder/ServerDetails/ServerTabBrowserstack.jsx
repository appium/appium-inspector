import {Input, Space} from 'antd';
import {useTranslation} from 'react-i18next';

import {INPUT} from '../../../constants/antd-types.js';

import styles from './ServerDetails.module.css';

const browserstackUsernamePlaceholder = (t) => {
  if (process.env.BROWSERSTACK_USERNAME) {
    return t('usingDataFoundIn', {environmentVariable: 'BROWSERSTACK_USERNAME'});
  }
  return t('yourUsername');
};

const browserstackAccessKeyPlaceholder = (t) => {
  if (process.env.BROWSERSTACK_ACCESS_KEY) {
    return t('usingDataFoundIn', {environmentVariable: 'BROWSERSTACK_ACCESS_KEY'});
  }
  return t('yourAccessKey');
};

const ServerTabBrowserstack = ({server, setServerParam}) => {
  const {t} = useTranslation();
  return (
    <div className={styles.serverDetailRow}>
      <div className={styles.serverInputField300px}>
        <Space.Compact block>
          <Space.Addon>{t('BrowserStack Username')}</Space.Addon>
          <Input
            id="browserstackUsername"
            placeholder={browserstackUsernamePlaceholder(t)}
            value={server.browserstack.username}
            onChange={(e) => setServerParam('username', e.target.value)}
          />
        </Space.Compact>
      </div>
      <div className={styles.serverInputField300px}>
        <Space.Compact block>
          <Space.Addon>{t('BrowserStack Access Key')}</Space.Addon>
          <Input
            id="browserstackPassword"
            type={INPUT.PASSWORD}
            placeholder={browserstackAccessKeyPlaceholder(t)}
            value={server.browserstack.accessKey}
            onChange={(e) => setServerParam('accessKey', e.target.value)}
          />
        </Space.Compact>
      </div>
    </div>
  );
};

export default ServerTabBrowserstack;
