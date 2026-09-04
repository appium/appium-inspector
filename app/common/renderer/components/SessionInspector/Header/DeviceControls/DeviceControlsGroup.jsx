import {DRIVERS} from '../../../../constants/common.js';
import AndroidControls from './AndroidControls.jsx';
import IDeviceControls from './IDeviceControls.jsx';

/**
 * Controls specific to the device under test (automationName + platformName).
 */
const DeviceControlsGroup = ({
  featureCaps,
  applyClientMethod,
  showSiriCommandModal,
  siriCommandValue,
  setSiriCommandValue,
  isSiriCommandModalVisible,
  hideSiriCommandModal,
}) => (
  <>
    {featureCaps.automationName === DRIVERS.XCUITEST && (
      <IDeviceControls
        applyClientMethod={applyClientMethod}
        showSiriCommandModal={showSiriCommandModal}
        siriCommandValue={siriCommandValue}
        setSiriCommandValue={setSiriCommandValue}
        isSiriCommandModalVisible={isSiriCommandModalVisible}
        hideSiriCommandModal={hideSiriCommandModal}
      />
    )}
    {[DRIVERS.UIAUTOMATOR2, DRIVERS.ESPRESSO].includes(featureCaps.automationName) && (
      <AndroidControls applyClientMethod={applyClientMethod} />
    )}
  </>
);

export default DeviceControlsGroup;
