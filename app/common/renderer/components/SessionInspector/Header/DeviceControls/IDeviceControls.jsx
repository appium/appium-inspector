import {Space} from 'antd';

import {COMMAND_EXECUTE_SCRIPT} from '../../../../constants/commands.js';
import {PLATFORMS} from '../../../../constants/common.js';
import IDevicePressButtonControls from './IDevicePressButtonControls.jsx';
import SiriControls from './SiriControls.jsx';
import WatchOSCrownControls from './WatchOSCrownControls.jsx';
import WatchOSGestureControls from './WatchOSGestureControls.jsx';

import inspectorStyles from '../../SessionInspector.module.css';

const toDropdownItem = (item) => ({
  key: item,
  label: <span className={inspectorStyles.monoFont}>{item}</span>,
});

/**
 * Device controls used for iOS/iPadOS/tvOS/watchOS sessions.
 */
const IDeviceControls = ({featureCaps, applyClientMethod}) => {
  const executeInteraction = (methodName, params) => {
    applyClientMethod({
      methodName: COMMAND_EXECUTE_SCRIPT,
      args: [methodName, [params]],
    });
  };

  return (
    <Space.Compact>
      <IDevicePressButtonControls
        featureCaps={featureCaps}
        toDropdownItem={toDropdownItem}
        executeInteraction={executeInteraction}
      />
      {featureCaps.platformName === PLATFORMS.WATCHOS && (
        <WatchOSCrownControls executeInteraction={executeInteraction} />
      )}
      {featureCaps.platformName === PLATFORMS.WATCHOS && (
        <WatchOSGestureControls
          platformVersion={featureCaps.platformVersion}
          toDropdownItem={toDropdownItem}
          executeInteraction={executeInteraction}
        />
      )}
      <SiriControls executeInteraction={executeInteraction} />
    </Space.Compact>
  );
};

export default IDeviceControls;
