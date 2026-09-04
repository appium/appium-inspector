import {DRIVERS} from '../../../../constants/common.js';
import EspressoControls from './EspressoControls.jsx';
import UiAutomator2Controls from './UiAutomator2Controls.jsx';

const UIA2_DISPLAY_CONTROLS_MIN_ANDROID_VER = 11;

/**
 * Controls specific to the driver (automationName)
 */
const DriverControlsGroup = ({featureCaps, sessionSettings, applyClientMethod}) => (
  <>
    {featureCaps.automationName === DRIVERS.UIAUTOMATOR2 &&
      featureCaps.platformVersion >= UIA2_DISPLAY_CONTROLS_MIN_ANDROID_VER && (
        <UiAutomator2Controls sessionSettings={sessionSettings} applyClientMethod={applyClientMethod} />
      )}
    {featureCaps.automationName === DRIVERS.ESPRESSO && (
      <EspressoControls sessionSettings={sessionSettings} applyClientMethod={applyClientMethod} />
    )}
  </>
);

export default DriverControlsGroup;
