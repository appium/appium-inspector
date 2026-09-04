import {IconCarouselHorizontal, IconCoffee, IconJetpack} from '@tabler/icons-react';
import {Button, Select, Space, Tooltip} from 'antd';
import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';

import {BUTTON} from '../../../constants/antd-types.js';
import {COMMAND_EXECUTE_SCRIPT, COMMAND_UPDATE_SETTINGS} from '../../../constants/commands.js';
import {DRIVERS} from '../../../constants/common.js';

/**
 * Controls specific to UiAutomator2 driver: switch available displays
 */
const UiA2ControlsGroup = ({sessionSettings, applyClientMethod}) => {
  const areMultiWindowsEnabled = sessionSettings.enableMultiWindows;
  const currentDisplayId = sessionSettings.currentDisplayId;

  const {t} = useTranslation();
  const multiDisplayLabel = t('toggleMultiDisplayMode');
  const [foundDisplays, setFoundDisplays] = useState(null);

  // Sets currentDisplayId and enableMultiWindows in one call, if either differs from their current value.
  // Note: with multiple displays but without enableMultiWindows: true, app source does not match the default display.
  const setDisplayAndMultiWindows = async (displayId, multiWindowMode = areMultiWindowsEnabled) => {
    const newSettingsObj = {};
    if (displayId !== currentDisplayId) {
      newSettingsObj.currentDisplayId = displayId;
    }
    if (multiWindowMode !== areMultiWindowsEnabled) {
      newSettingsObj.enableMultiWindows = multiWindowMode;
    }
    if (Object.keys(newSettingsObj).length > 0) {
      await applyClientMethod({
        methodName: COMMAND_UPDATE_SETTINGS,
        args: [newSettingsObj],
      });
    }
  };

  // Handler for updating foundDisplays: multi-window mode can be toggled not only with the button below,
  // but also via capabilities or commands directly
  useEffect(() => {
    const retrieveDisplays = async () => {
      const newDisplays = await applyClientMethod({
        methodName: COMMAND_EXECUTE_SCRIPT,
        args: ['mobile:listDisplays', []],
        skipRefresh: true,
      });
      setFoundDisplays(newDisplays ?? []);
    };

    if (areMultiWindowsEnabled && foundDisplays == null) {
      retrieveDisplays();
    } else if (areMultiWindowsEnabled === false && foundDisplays != null) {
      setFoundDisplays(null);
    }
  }, [applyClientMethod, areMultiWindowsEnabled, foundDisplays]);

  return (
    <Space.Compact>
      <Tooltip title={multiDisplayLabel}>
        <Button
          aria-label={multiDisplayLabel}
          icon={<IconCarouselHorizontal size={18} />}
          type={foundDisplays ? BUTTON.PRIMARY : BUTTON.DEFAULT}
          onClick={() => setDisplayAndMultiWindows(0, !areMultiWindowsEnabled)}
        />
      </Tooltip>
      {foundDisplays && (
        <Select
          styles={{root: {width: 250}}}
          value={currentDisplayId}
          popupMatchSelectWidth={false}
          onChange={(value) => setDisplayAndMultiWindows(value)}
          options={foundDisplays.map(({id, name}) => ({
            value: id,
            label: name ? `${name} (ID ${id})` : id,
          }))}
        />
      )}
    </Space.Compact>
  );
};

/**
 * Controls specific to Espresso driver: switch subdriver
 */
const EspressoControlsGroup = ({sessionSettings, applyClientMethod}) => {
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

/**
 * Controls specific to the driver (automationName)
 */
const DriverControlsGroup = ({featureCaps, sessionSettings, applyClientMethod}) => (
  <>
    {featureCaps.automationName === DRIVERS.UIAUTOMATOR2 && (
      <UiA2ControlsGroup sessionSettings={sessionSettings} applyClientMethod={applyClientMethod} />
    )}
    {featureCaps.automationName === DRIVERS.ESPRESSO && (
      <EspressoControlsGroup sessionSettings={sessionSettings} applyClientMethod={applyClientMethod} />
    )}
  </>
);

export default DriverControlsGroup;
