import {Checkbox, Input, Space} from 'antd';
import {useTranslation} from 'react-i18next';

import {PROVIDER_VALUES} from '../../../constants/session-builder.js';

import styles from './ServerDetails.module.css';

const portPlaceholder = (server) => (server.perfecto.ssl ? '443' : '80');

const perfectoTokenPlaceholder = (t) => {
  if (process.env.PERFECTO_TOKEN) {
    return t('usingDataFoundIn', {environmentVariable: 'PERFECTO_TOKEN'});
  }
  return t('Add your token');
};

const ServerTabPerfecto = ({server, setServerParam}) => {
  const {t} = useTranslation();
  return (
    <div className={styles.serverRow}>
      <div className={styles.perfectoHostPortGroup}>
        <Space.Compact block>
          <Space.Addon>{t('Perfecto Host')}</Space.Addon>
          <Input
            id="PerfectoServerHost"
            placeholder={PROVIDER_VALUES.PERFECTO_URL}
            value={server.perfecto.hostname}
            onChange={(e) => setServerParam('hostname', e.target.value)}
          />
        </Space.Compact>
        <Space.Compact>
          <Space.Addon>{t('Perfecto Port')}</Space.Addon>
          <Input
            id="PerfectoPort"
            className={styles.serverPortInput}
            placeholder={portPlaceholder(server)}
            value={server.perfecto.port}
            onChange={(e) => setServerParam('port', e.target.value)}
          />
        </Space.Compact>
      </div>
      <div className={styles.perfectoPathSSLGroup}>
        <Space.Compact block>
          <Space.Addon>{t('Perfecto Token')}</Space.Addon>
          <Input
            id="token"
            placeholder={perfectoTokenPlaceholder(t)}
            value={server.perfecto.token}
            onChange={(e) => setServerParam('token', e.target.value)}
          />
        </Space.Compact>
        <Checkbox
          className={styles.addonCheckbox}
          checked={!!server.perfecto.ssl}
          onChange={(e) => setServerParam('ssl', e.target.checked)}
        >
          SSL
        </Checkbox>
      </div>
    </div>
  );
};

export default ServerTabPerfecto;
