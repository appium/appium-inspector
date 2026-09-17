import {Input, Space} from 'antd';
import {useTranslation} from 'react-i18next';

import {INPUT} from '../../../constants/antd-types.js';

import styles from './ServerDetails.module.css';

const robotActionsTokenPlaceholder = (t) => {
  if (process.env.ROBOTACTIONS_TOKEN) {
    return t('usingDataFoundIn', {environmentVariable: 'ROBOTACTIONS_TOKEN'});
  }
  return t('yourApiKey');
};

const ServerTabRobotActions = ({server, setServerParam}) => {
  const {t} = useTranslation();
  return (
    <div className={styles.serverDetailRow}>
      <div className={styles.serverInputField400px}>
        <Space.Compact block>
          <Space.Addon>{t('RobotActions Host')}</Space.Addon>
          <Input
            id="robotActionsHost"
            placeholder="XXXXX.robotactions.com"
            value={server.robotactions.host}
            onChange={(e) => setServerParam('host', e.target.value)}
          />
        </Space.Compact>
      </div>
      <div className={styles.serverInputField400px}>
        <Space.Compact block>
          <Space.Addon>{t('RobotActions Token')}</Space.Addon>
          <Input
            id="robotActionsToken"
            type={INPUT.PASSWORD}
            placeholder={robotActionsTokenPlaceholder(t)}
            value={server.robotactions.token}
            onChange={(e) => setServerParam('token', e.target.value)}
          />
        </Space.Compact>
      </div>
    </div>
  );
};

export default ServerTabRobotActions;
