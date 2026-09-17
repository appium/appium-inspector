import {Checkbox, Input, Radio, Space} from 'antd';
import {useTranslation} from 'react-i18next';

import {INPUT} from '../../../constants/antd-types.js';

import styles from './ServerDetails.module.css';

const sauceUsernamePlaceholder = (t) => {
  if (process.env.SAUCE_USERNAME) {
    return t('usingDataFoundIn', {environmentVariable: 'SAUCE_USERNAME'});
  }
  return t('yourUsername');
};

const sauceAccessKeyPlaceholder = (t) => {
  if (process.env.SAUCE_ACCESS_KEY) {
    return t('usingDataFoundIn', {environmentVariable: 'SAUCE_ACCESS_KEY'});
  }
  return t('yourAccessKey');
};

const ServerTabSauce = ({server, setServerParam}) => {
  const {t} = useTranslation();

  const dataCenterOptions = [
    {label: t('US-West'), value: 'us-west-1'},
    {label: t('US-East'), value: 'us-east-4'},
    {label: t('EU-Central'), value: 'eu-central-1'},
  ];

  return (
    <div className={styles.serverDetailRow}>
      <div className={styles.serverInputField300px}>
        <Space.Compact block>
          <Space.Addon>{t('Sauce Username')}</Space.Addon>
          <Input
            id="sauceUsername"
            placeholder={sauceUsernamePlaceholder(t)}
            value={server.sauce.username}
            onChange={(e) => setServerParam('username', e.target.value)}
          />
        </Space.Compact>
      </div>
      <div className={styles.serverInputField300px}>
        <Space.Compact block>
          <Space.Addon>{t('Sauce Access Key')}</Space.Addon>
          <Input
            id="saucePassword"
            type={INPUT.PASSWORD}
            placeholder={sauceAccessKeyPlaceholder(t)}
            value={server.sauce.accessKey}
            onChange={(e) => setServerParam('accessKey', e.target.value)}
          />
        </Space.Compact>
      </div>
      <div className={styles.sauceDataCenterGroup}>
        <Space.Compact block>
          <Space.Addon>{t('SauceLabs Data Center')}</Space.Addon>
          <Radio.Group
            className={styles.sauceDataCenterRadioGroup}
            options={dataCenterOptions}
            buttonStyle="solid"
            defaultValue="us-west-1"
            id="sauceObjectDataCenter"
            value={server.sauce.dataCenter}
            onChange={(e) => setServerParam('dataCenter', e.target.value)}
          />
        </Space.Compact>
      </div>
      <div className={styles.serverInputGroup500px}>
        <Checkbox
          styles={{root: {maxHeight: '32px', alignItems: 'center'}}}
          checked={!!server.sauce.useSCProxy}
          onChange={(e) => setServerParam('useSCProxy', e.target.checked)}
        >
          {t('proxyThroughSC')}
        </Checkbox>
        <Space.Compact>
          <Space.Addon>{t('Host')}</Space.Addon>
          <Input
            placeholder="localhost"
            disabled={!server.sauce.useSCProxy}
            value={server.sauce.scHost}
            onChange={(e) => setServerParam('scHost', e.target.value)}
          />
        </Space.Compact>
        <Space.Compact>
          <Space.Addon>{t('Port')}</Space.Addon>
          <Input
            placeholder={4445}
            className={styles.serverPortInputField}
            disabled={!server.sauce.useSCProxy}
            value={server.sauce.scPort}
            onChange={(e) => setServerParam('scPort', e.target.value)}
          />
        </Space.Compact>
      </div>
    </div>
  );
};

export default ServerTabSauce;
