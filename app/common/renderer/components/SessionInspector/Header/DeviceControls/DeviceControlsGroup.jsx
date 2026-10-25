import {DRIVERS} from '../../../../constants/common.js';
import AndroidControls from './AndroidControls.jsx';
import IDeviceControls from './IDeviceControls.jsx';

/**
 * Controls specific to the device under test (automationName + platformName).
 */
const DeviceControlsGroup = ({featureCaps, applyClientMethod, executeDriverCommand}) => (
  <>
    {featureCaps.automationName === DRIVERS.XCUITEST && (
      <IDeviceControls
        featureCaps={featureCaps}
        applyClientMethod={applyClientMethod}
        executeDriverCommand={executeDriverCommand}
      />
    )}
    {[DRIVERS.UIAUTOMATOR2, DRIVERS.ESPRESSO].includes(featureCaps.automationName) && (
      <AndroidControls applyClientMethod={applyClientMethod} />
    )}
  </>
);

export default DeviceControlsGroup;
