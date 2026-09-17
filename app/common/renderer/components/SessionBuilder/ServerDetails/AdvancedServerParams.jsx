import {Checkbox, Collapse, Input} from 'antd';
import {useTranslation} from 'react-i18next';

import {SERVER_ADVANCED_PARAMS, SERVER_TYPES} from '../../../constants/session-builder.js';

import styles from './ServerDetails.module.css';

const AdvancedServerParams = ({server, setServerParam, serverType}) => {
  const {t} = useTranslation();

  return (
    <Collapse
      styles={{header: {padding: '8px'}, body: {padding: '8px'}}}
      items={[
        {
          label: t('Advanced Settings'),
          children: (
            <div className={styles.advancedSettingsRow}>
              {serverType !== SERVER_TYPES.TESTMUAI && (
                <div className={styles.serverInputField250px}>
                  <Checkbox
                    className={styles.addonCheckbox}
                    checked={!!server.advanced.allowUnauthorized}
                    onChange={(e) =>
                      setServerParam(SERVER_ADVANCED_PARAMS.ALLOW_UNAUTHORIZED, e.target.checked, SERVER_TYPES.ADVANCED)
                    }
                  >
                    {t('allowUnauthorizedCerts')}
                  </Checkbox>
                </div>
              )}
              <div className={styles.serverInputGroup500px}>
                <Checkbox
                  styles={{root: {minWidth: '100px'}}}
                  className={styles.addonCheckbox}
                  checked={!!server.advanced.useProxy}
                  onChange={(e) =>
                    setServerParam(SERVER_ADVANCED_PARAMS.USE_PROXY, e.target.checked, SERVER_TYPES.ADVANCED)
                  }
                >
                  {t('Use Proxy')}
                </Checkbox>
                <Input
                  styles={{root: {maxWidth: '400px'}}}
                  disabled={!server.advanced.useProxy}
                  onChange={(e) => setServerParam(SERVER_ADVANCED_PARAMS.PROXY, e.target.value, SERVER_TYPES.ADVANCED)}
                  placeholder={t('Proxy URL')}
                  value={server.advanced.proxy}
                />
              </div>
            </div>
          ),
        },
      ]}
    />
  );
};

export default AdvancedServerParams;
