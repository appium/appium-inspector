import {IconCarouselHorizontal} from '@tabler/icons-react';
import {Button, Select, Space, Tooltip} from 'antd';
import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';

import {BUTTON} from '../../../../constants/antd-types.js';
import {COMMAND_EXECUTE_SCRIPT, COMMAND_UPDATE_SETTINGS} from '../../../../constants/commands.js';

/**
 * Button + dropdown to switch the available display in UiAutomator2 sessions.
 * Requires UiAutomator2 6.6.0 or later + Android 11 or later
 */
const UiA2DisplayControls = ({sessionSettings, applyClientMethod}) => {
  const currentDisplayId = sessionSettings.currentDisplayId;

  const {t} = useTranslation();
  const multiDisplayLabel = t('toggleMultiDisplayMode');
  const [displaySelectionVisible, setDisplaySelectionVisible] = useState(false);
  const [foundDisplays, setFoundDisplays] = useState(null);

  // Sets currentDisplayId, if it differs from its current value.
  const setCurrentDisplay = async (displayId) => {
    if (displayId !== currentDisplayId) {
      await applyClientMethod({
        methodName: COMMAND_UPDATE_SETTINGS,
        args: [
          {
            currentDisplayId: displayId,
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
      await setCurrentDisplay(0);
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
          value={currentDisplayId}
          popupMatchSelectWidth={false}
          onChange={setCurrentDisplay}
          options={foundDisplays.map(({id, name}) => ({
            value: id,
            label: name ? `${name} (ID ${id})` : id,
          }))}
        />
      )}
    </Space.Compact>
  );
};

export default UiA2DisplayControls;
