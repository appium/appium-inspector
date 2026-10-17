import {IconCarouselHorizontal} from '@tabler/icons-react';
import {Button, Select, Space, Tooltip} from 'antd';
import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';

import {BUTTON} from '../../../../constants/antd-types.js';
import {COMMAND_EXECUTE_SCRIPT, COMMAND_UPDATE_SETTINGS} from '../../../../constants/commands.js';
import {DRIVERS} from '../../../../constants/common.js';

// Ant Design does not support null values in Select
const NON_NULL_DISPLAY_ID = -1;

/**
 * Button + dropdown to switch the available display.
 * Requires either UiAutomator2 driver 6.6.0+ with Android 11+, or XCUITest driver with iOS.
 */
const DisplayControls = ({sessionSettings, applyClientMethod, automationName}) => {
  // UiAutomator2 and XCUITest have different default values for currentDisplayId
  const defaultDisplayId = automationName === DRIVERS.XCUITEST ? null : 0;
  const currentDisplayId = sessionSettings.currentDisplayId;

  const {t} = useTranslation();
  const multiDisplayLabel = t('toggleMultiDisplayMode');
  const [displaySelectionVisible, setDisplaySelectionVisible] = useState(false);
  const [foundDisplays, setFoundDisplays] = useState(null);

  const getDisplayChoices = (foundDisplays) => {
    const optionsArray = foundDisplays.map(({id, name, metrics}) => {
      // XCUITest driver does not provide display names, so list dimensions instead
      const baseLabel = name ? name : `${metrics.widthPixels}x${metrics.heightPixels}`;
      return {
        value: id,
        label: `${baseLabel} (ID ${id})`,
      };
    });
    // The default 'null' option for XCUITest is not included in listDisplays, so explicitly add it
    if (defaultDisplayId === null) {
      optionsArray.unshift({value: NON_NULL_DISPLAY_ID, label: `${t('defaultDisplay')} (ID null)`});
    }
    return optionsArray;
  };

  // Sets currentDisplayId, if it differs from its current value.
  const setCurrentDisplay = async (displayId) => {
    const adjustedDisplayId = displayId === NON_NULL_DISPLAY_ID ? null : displayId;
    if (adjustedDisplayId !== currentDisplayId) {
      await applyClientMethod({
        methodName: COMMAND_UPDATE_SETTINGS,
        args: [
          {
            currentDisplayId: adjustedDisplayId,
          },
        ],
      });
    }
  };

  const toggleDisplaySelectionVisibility = async () => {
    const selectionShouldBeVisible = !displaySelectionVisible;
    setDisplaySelectionVisible(selectionShouldBeVisible);
    if (!selectionShouldBeVisible) {
      // toggling off, reset to default display and clear stored displays
      await setCurrentDisplay(defaultDisplayId);
      setFoundDisplays(null);
    }
  };

  // Handler for updating foundDisplays: display id can be set not only with the dropdown below,
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

    // display search should run only if it has not run yet, and:
    // - currentDisplayId is truthy (i.e. set via capabilities/commands), or
    // - displaySelectionVisible is true (i.e. toggled via UI)
    if ((currentDisplayId || displaySelectionVisible) && foundDisplays == null) {
      retrieveDisplays();
      if (!displaySelectionVisible) {
        setDisplaySelectionVisible(true);
      }
    }
  }, [applyClientMethod, currentDisplayId, displaySelectionVisible, foundDisplays]);

  return (
    <Space.Compact>
      <Tooltip title={multiDisplayLabel}>
        <Button
          aria-label={multiDisplayLabel}
          icon={<IconCarouselHorizontal size={18} />}
          type={foundDisplays ? BUTTON.PRIMARY : BUTTON.DEFAULT}
          onClick={toggleDisplaySelectionVisibility}
        />
      </Tooltip>
      {displaySelectionVisible && foundDisplays && (
        <Select
          styles={{root: {width: 200}}}
          value={currentDisplayId == null ? NON_NULL_DISPLAY_ID : currentDisplayId}
          popupMatchSelectWidth={false}
          onChange={setCurrentDisplay}
          options={getDisplayChoices(foundDisplays)}
        />
      )}
    </Space.Compact>
  );
};

export default DisplayControls;
