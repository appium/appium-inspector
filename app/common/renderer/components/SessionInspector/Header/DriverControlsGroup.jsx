import {IconCarouselHorizontal} from '@tabler/icons-react';
import {Button, Select, Space, Tooltip} from 'antd';
import {useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';

import {BUTTON} from '../../../constants/antd-types.js';
import {COMMAND_EXECUTE_SCRIPT, COMMAND_UPDATE_SETTINGS} from '../../../constants/commands.js';
import {DRIVERS} from '../../../constants/common.js';

/**
 * Controls used to switch available displays (Android UiAutomator2 only)
 */
const UiA2ControlsGroup = ({sessionSettings, applyClientMethod}) => {
  const areMultiWindowsEnabled = sessionSettings.enableMultiWindows;
  const currentDisplayId = sessionSettings.currentDisplayId;

  const {t} = useTranslation();
  const multiDisplayLabel = t('toggleMultiDisplayMode');
  // Guards against re-running the initial-state check below more than once
  const hasCheckedInitialMultiWindowState = useRef(false);
  const [foundDisplays, setFoundDisplays] = useState(null);

  // Allows to set both currentDisplayId and enableMultiWindows, if either differs from their current value.
  // Note: with multiple displays but without enableMultiWindows: true, app source does not match the default display.
  const setDisplayAndMultiWindows = async (displayId, multiWindowMode = areMultiWindowsEnabled) => {
    const args = [];
    if (displayId !== currentDisplayId) {
      args.push({currentDisplayId: displayId});
    }
    if (multiWindowMode !== areMultiWindowsEnabled) {
      args.push({enableMultiWindows: multiWindowMode});
    }
    if (args.length > 0) {
      await applyClientMethod({
        methodName: COMMAND_UPDATE_SETTINGS,
        args,
      });
    }
  };

  const fetchAndSetDisplays = async () => {
    const newDisplays = await applyClientMethod({
      methodName: COMMAND_EXECUTE_SCRIPT,
      args: ['mobile:listDisplays', []],
      skipRefresh: true,
    });
    setFoundDisplays(newDisplays);
  };

  const toggleMultiDisplayMode = async () => {
    if (areMultiWindowsEnabled) {
      // Toggling off: reset to defaults and clear found displays
      await setDisplayAndMultiWindows(0, false);
      return setFoundDisplays(null);
    }
    // Toggling on: enable multi window mode, then find + save displays
    await setDisplayAndMultiWindows(0, true);
    await fetchAndSetDisplays();
  };

  // On the initial render, once settings are populated,
  // and if multi-window mode is enabled, fetch the list of displays
  useEffect(() => {
    if (hasCheckedInitialMultiWindowState.current || areMultiWindowsEnabled !== true) {
      return;
    }
    hasCheckedInitialMultiWindowState.current = true;
    fetchAndSetDisplays();
  }, [areMultiWindowsEnabled, applyClientMethod]);

  return (
    <Space.Compact>
      <Tooltip title={multiDisplayLabel}>
        <Button
          aria-label={multiDisplayLabel}
          icon={<IconCarouselHorizontal size={18} />}
          type={foundDisplays ? BUTTON.PRIMARY : BUTTON.DEFAULT}
          onClick={() => toggleMultiDisplayMode()}
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
 * Controls specific to the driver (automationName)
 */
const DriverControlsGroup = ({automationName, sessionSettings, applyClientMethod}) =>
  automationName === DRIVERS.UIAUTOMATOR2 && (
    <UiA2ControlsGroup sessionSettings={sessionSettings} applyClientMethod={applyClientMethod} />
  );

export default DriverControlsGroup;
