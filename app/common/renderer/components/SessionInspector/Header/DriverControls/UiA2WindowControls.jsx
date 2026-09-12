import {IconLayoutDashboard} from '@tabler/icons-react';
import {Button, Select, Space, Tooltip} from 'antd';
import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';

import {BUTTON} from '../../../../constants/antd-types.js';
import {COMMAND_UPDATE_SETTINGS} from '../../../../constants/commands.js';
import {UIA2_WINDOW_STRATEGIES} from '../../../../constants/driver-specific.js';

/**
 * Button + dropdown to select the window retrieval strategy in UiAutomator2 sessions.
 * Requires UiAutomator2 2.25.1 or later
 */
const UiA2WindowControls = ({sessionSettings, applyClientMethod}) => {
  const areMultiWindowsEnabled = sessionSettings.enableMultiWindows;
  const isTopmostWindowUsed = sessionSettings.enableTopmostWindowFromActivePackage;

  const {t} = useTranslation();
  const activeWindowLabel = t('toggleActiveWindowSelection');

  const [windowStrategy, setWindowStrategy] = useState(UIA2_WINDOW_STRATEGIES.FOCUSED);
  const [windowSelectionVisible, setWindowSelectionVisible] = useState(false);

  const activeWindowStrategyDropdownOptions = [
    {
      value: UIA2_WINDOW_STRATEGIES.FOCUSED,
      label: t('focusedWindow'),
    },
    {
      value: UIA2_WINDOW_STRATEGIES.TOPMOST,
      label: t('topmostWindow'),
    },
    {
      value: UIA2_WINDOW_STRATEGIES.ALL,
      label: t('allWindows'),
    },
  ];

  // Sets enableMultiWindows and/or enableTopmostWindowFromActivePackage,
  // when the current active window strategy is changed.
  const setActiveWindowStrategySetting = async (strategy) => {
    const shouldEnableMultiWindows = strategy === UIA2_WINDOW_STRATEGIES.ALL;
    const shouldUseTopmostWindow = strategy === UIA2_WINDOW_STRATEGIES.TOPMOST;

    if (shouldEnableMultiWindows !== areMultiWindowsEnabled || shouldUseTopmostWindow !== isTopmostWindowUsed) {
      await applyClientMethod({
        methodName: COMMAND_UPDATE_SETTINGS,
        args: [
          {
            enableMultiWindows: shouldEnableMultiWindows,
            enableTopmostWindowFromActivePackage: shouldUseTopmostWindow,
          },
        ],
      });
    }
  };

  const toggleWindowSelectionVisibility = async () => {
    const selectionShouldBeVisible = !windowSelectionVisible;
    setWindowSelectionVisible(selectionShouldBeVisible);
    if (!selectionShouldBeVisible) {
      // toggling off, reset to default strategy
      await setActiveWindowStrategySetting(UIA2_WINDOW_STRATEGIES.FOCUSED);
    }
  };

  // Handler for updating windowStrategy: it can be set not only with the dropdown below,
  // but also via capabilities or commands directly
  useEffect(() => {
    if (areMultiWindowsEnabled) {
      setWindowStrategy(UIA2_WINDOW_STRATEGIES.ALL);
      setWindowSelectionVisible(true);
    } else if (isTopmostWindowUsed) {
      setWindowStrategy(UIA2_WINDOW_STRATEGIES.TOPMOST);
      setWindowSelectionVisible(true);
    } else {
      setWindowStrategy(UIA2_WINDOW_STRATEGIES.FOCUSED);
      // leave windowSelectionVisible unchanged
    }
  }, [areMultiWindowsEnabled, isTopmostWindowUsed]);

  return (
    <Space.Compact>
      <Tooltip title={activeWindowLabel}>
        <Button
          aria-label={activeWindowLabel}
          icon={<IconLayoutDashboard size={18} />}
          type={windowSelectionVisible ? BUTTON.PRIMARY : BUTTON.DEFAULT}
          onClick={toggleWindowSelectionVisibility}
        />
      </Tooltip>
      {windowSelectionVisible && (
        <Select
          styles={{root: {width: 200}}}
          value={windowStrategy}
          popupMatchSelectWidth={false}
          onChange={setActiveWindowStrategySetting}
          options={activeWindowStrategyDropdownOptions}
        />
      )}
    </Space.Compact>
  );
};

export default UiA2WindowControls;
