import {Input, Space} from 'antd';
import {useTranslation} from 'react-i18next';

import {INPUT} from '../../../constants/antd-types.js';

import styles from './ServerDetails.module.css';

const testMuAIUsernamePlaceholder = (t) => {
  if (process.env.LAMBDATEST_USERNAME) {
    return t('usingDataFoundIn', {environmentVariable: 'LAMBDATEST_USERNAME'});
  }
  return t('yourUsername');
};

const testMuAIAccessKeyPlaceholder = (t) => {
  if (process.env.LAMBDATEST_ACCESS_KEY) {
    return t('usingDataFoundIn', {environmentVariable: 'LAMBDATEST_ACCESS_KEY'});
  }
  return t('yourAccessKey');
};

const ServerTabTestMuAI = ({server, setServerParam}) => {
  const {t} = useTranslation();
  return (
    <div className={styles.serverDetailRow}>
      <div className={styles.serverInputField300px}>
        <Space.Compact block>
          <Space.Addon>{t('TestMu AI Username')}</Space.Addon>
          <Input
            id="testMuAIUsername"
            placeholder={testMuAIUsernamePlaceholder(t)}
            value={server.lambdatest.username}
            onChange={(e) => setServerParam('username', e.target.value)}
          />
        </Space.Compact>
      </div>
      <div className={styles.serverInputField300px}>
        <Space.Compact block>
          <Space.Addon>{t('TestMu AI Access Key')}</Space.Addon>
          <Input
            id="testMuAIUsernameAccessKey"
            type={INPUT.PASSWORD}
            placeholder={testMuAIAccessKeyPlaceholder(t)}
            value={server.lambdatest.accessKey}
            onChange={(e) => setServerParam('accessKey', e.target.value)}
          />
        </Space.Compact>
      </div>
    </div>
  );
};

export default ServerTabTestMuAI;
