import {DRIVERS} from '../../../../constants/common.js';
import EspressoControls from './EspressoControls.jsx';
import UiAutomator2Controls from './UiAutomator2Controls.jsx';

/**
 * Controls specific to the driver (automationName)
 */
const DriverControlsGroup = ({featureCaps, sessionSettings, applyClientMethod}) => (
  <>
    {featureCaps.automationName === DRIVERS.UIAUTOMATOR2 && (
      <UiAutomator2Controls
        featureCaps={featureCaps}
        sessionSettings={sessionSettings}
        applyClientMethod={applyClientMethod}
      />
    )}
    {featureCaps.automationName === DRIVERS.ESPRESSO && (
      <EspressoControls sessionSettings={sessionSettings} applyClientMethod={applyClientMethod} />
    )}
  </>
);

export default DriverControlsGroup;
