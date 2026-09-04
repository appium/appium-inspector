import {IconCarouselHorizontal} from '@tabler/icons-react';
import {Button, Select, Space, Tooltip} from 'antd';
import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';

import {BUTTON} from '../../../constants/antd-types.js';
import {COMMAND_EXECUTE_SCRIPT, COMMAND_UPDATE_SETTINGS} from '../../../constants/commands.js';
import {DRIVERS} from '../../../constants/common.js';
import {isEmpty} from '../../../utils/common.js';

/**
 * Controls used to switch available displays (Android UiAutomator2 only)
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
    if (areMultiWindowsEnabled && isEmpty(foundDisplays)) {
      const retrieveDisplays = async () => {
        const newDisplays = await applyClientMethod({
          methodName: COMMAND_EXECUTE_SCRIPT,
          args: ['mobile:listDisplays', []],
          skipRefresh: true,
        });
        setFoundDisplays(newDisplays);
      };
      retrieveDisplays();
    } else if (areMultiWindowsEnabled === false && !isEmpty(foundDisplays)) {
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
 * Controls specific to the driver (automationName)
 */
const DriverControlsGroup = ({automationName, sessionSettings, applyClientMethod}) =>
  automationName === DRIVERS.UIAUTOMATOR2 && (
    <UiA2ControlsGroup sessionSettings={sessionSettings} applyClientMethod={applyClientMethod} />
  );

export default DriverControlsGroup;
