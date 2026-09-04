import {IconCoffee, IconJetpack} from '@tabler/icons-react';
import {Button, Space, Tooltip} from 'antd';
import {useTranslation} from 'react-i18next';

import {BUTTON} from '../../../../constants/antd-types.js';
import {COMMAND_UPDATE_SETTINGS} from '../../../../constants/commands.js';
import {DRIVERS} from '../../../../constants/common.js';

/**
 * Controls specific to Espresso driver: switch subdriver
 */
const EspressoControls = ({sessionSettings, applyClientMethod}) => {
  /**
   * The 'driver' setting is always populated,
   * and is always set to exactly 'espresso' or 'compose'
   */
  const currentSubdriver = sessionSettings.driver;

  const {t} = useTranslation();
  const switchToEspressoLabel = t('switchToEspressoSubdriver');
  const switchToComposeLabel = t('switchToComposeSubdriver');

  const updateSubdriver = async (subdriverName) => {
    if (subdriverName !== currentSubdriver) {
      /**
       * Disable auto-refresh for updateSettings, since the setting may get updated, but source retrieval
       * may return an error if no hierarchy is found, causing storeSessionSettings to never get called,
       * which leaves subdriverName with its old value. But we still want to refresh, so call it explicitly.
       */
      await applyClientMethod({
        methodName: COMMAND_UPDATE_SETTINGS,
        args: [{driver: subdriverName}],
        skipRefresh: true,
      });
      await applyClientMethod({methodName: 'getPageSource'});
    }
  };

  return (
    <Space.Compact>
      <Tooltip title={switchToEspressoLabel}>
        <Button
          aria-label={switchToEspressoLabel}
          icon={<IconCoffee size={18} />}
          onClick={() => updateSubdriver(DRIVERS.ESPRESSO)}
          type={currentSubdriver === DRIVERS.ESPRESSO ? BUTTON.PRIMARY : BUTTON.DEFAULT}
        />
      </Tooltip>
      <Tooltip title={switchToComposeLabel}>
        <Button
          aria-label={switchToComposeLabel}
          icon={<IconJetpack size={18} />}
          onClick={() => updateSubdriver(DRIVERS.COMPOSE)}
          type={currentSubdriver === DRIVERS.COMPOSE ? BUTTON.PRIMARY : BUTTON.DEFAULT}
        />
      </Tooltip>
    </Space.Compact>
  );
};

export default EspressoControls;
