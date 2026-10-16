import {Space} from 'antd';

import {DRIVERS, PLATFORMS} from '../../../../constants/common.js';
import ActiveWindowControls from './ActiveWindowControls.jsx';
import DisplayControls from './DisplayControls.jsx';
import SubdriverControls from './SubdriverControls.jsx';

const DISPLAY_CONTROLS_MIN_ANDROID_VER = 11;

/**
 * Controls specific to the driver (automationName)
 */
const DriverControlsGroup = ({featureCaps, sessionSettings, applyClientMethod}) => (
  <Space.Compact>
    {((featureCaps.automationName === DRIVERS.XCUITEST && featureCaps.platformName === PLATFORMS.IOS) ||
      (featureCaps.automationName === DRIVERS.UIAUTOMATOR2 &&
        featureCaps.platformVersion >= DISPLAY_CONTROLS_MIN_ANDROID_VER)) && (
      <DisplayControls
        sessionSettings={sessionSettings}
        applyClientMethod={applyClientMethod}
        automationName={featureCaps.automationName}
      />
    )}
    {featureCaps.automationName === DRIVERS.UIAUTOMATOR2 && (
      <ActiveWindowControls sessionSettings={sessionSettings} applyClientMethod={applyClientMethod} />
    )}
    {featureCaps.automationName === DRIVERS.ESPRESSO && (
      <SubdriverControls sessionSettings={sessionSettings} applyClientMethod={applyClientMethod} />
    )}
  </Space.Compact>
);

export default DriverControlsGroup;
