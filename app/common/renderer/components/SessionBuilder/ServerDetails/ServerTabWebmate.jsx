import {Checkbox, Input, Space} from 'antd';
import {useTranslation} from 'react-i18next';

import {INPUT} from '../../../constants/antd-types.js';

import styles from './ServerDetails.module.css';

const ServerTabWebmate = ({server, setServerParam}) => {
  const {t} = useTranslation();
  return (
    <div className={styles.serverDetailRow}>
      <div className={styles.serverInputField300px}>
        <Space.Compact block>
          <Space.Addon>{t('webmateApiKey')}</Space.Addon>
          <Input
            type={INPUT.PASSWORD}
            placeholder={
              process.env.WEBMATE_APIKEY
                ? t('usingDataFoundIn', {environmentVariable: 'WEBMATE_APIKEY'})
                : t('yourApiKey')
            }
            value={server.webmate.apiKey}
            onChange={(e) => setServerParam('apiKey', e.target.value)}
          />
        </Space.Compact>
      </div>
      <div className={styles.serverInputField300px}>
        <Space.Compact block>
          <Space.Addon>{t('webmateProjectId')}</Space.Addon>
          <Input
            placeholder={
              process.env.WEBMATE_PROJECT
                ? t('usingDataFoundIn', {environmentVariable: 'WEBMATE_PROJECT'})
                : t('yourProjectId')
            }
            value={server.webmate.projectId}
            onChange={(e) => setServerParam('projectId', e.target.value)}
          />
        </Space.Compact>
      </div>
      <div className={styles.serverInputGroup500px}>
        <Checkbox
          styles={{root: {minWidth: '20em', alignItems: 'center'}}}
          className={styles.webmateCustomHostCheckbox}
          checked={!!server.webmate.useCustomHost}
          onChange={(e) => setServerParam('useCustomHost', e.target.checked)}
        >
          {t('specifyWebmateHostExplicitly')}
        </Checkbox>
        <Space.Compact block>
          <Space.Addon>{t('webmateHost')}</Space.Addon>
          <Input
            placeholder={
              process.env.WEBMATE_HOST
                ? t('usingDataFoundIn', {environmentVariable: 'WEBMATE_HOST'})
                : 'selenium.webmate.io'
            }
            disabled={!server.webmate.useCustomHost}
            value={server.webmate.seleniumHost}
            onChange={(e) => setServerParam('seleniumHost', e.target.value)}
          />
        </Space.Compact>
      </div>
    </div>
  );
};

export default ServerTabWebmate;
