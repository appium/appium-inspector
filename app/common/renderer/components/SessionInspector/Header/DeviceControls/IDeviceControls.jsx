import {IconMessageChatbot} from '@tabler/icons-react';
import {Button, Space, Tooltip} from 'antd';
import {useTranslation} from 'react-i18next';

import {COMMAND_EXECUTE_SCRIPT} from '../../../../constants/commands.js';
import {PLATFORMS} from '../../../../constants/common.js';
import IDevicePressButtonControls from './IDevicePressButtonControls.jsx';
import SiriCommandModal from './SiriCommandModal.jsx';
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
const IDeviceControls = ({
  featureCaps,
  applyClientMethod,
  showSiriCommandModal,
  siriCommandValue,
  setSiriCommandValue,
  isSiriCommandModalVisible,
  hideSiriCommandModal,
}) => {
  const {t} = useTranslation();
  const siriLabel = t('Execute Siri Command');

  const executeInteraction = (methodName, params) => {
    applyClientMethod({
      methodName: COMMAND_EXECUTE_SCRIPT,
      args: [methodName, [params]],
    });
  };

  return (
    <>
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
        <Tooltip title={siriLabel}>
          <Button
            aria-label={siriLabel}
            id="siriCommand"
            icon={<IconMessageChatbot size={18} />}
            onClick={showSiriCommandModal}
          />
        </Tooltip>
      </Space.Compact>
      <SiriCommandModal
        siriCommandValue={siriCommandValue}
        setSiriCommandValue={setSiriCommandValue}
        isSiriCommandModalVisible={isSiriCommandModalVisible}
        applyClientMethod={applyClientMethod}
        hideSiriCommandModal={hideSiriCommandModal}
      />
    </>
  );
};

export default IDeviceControls;
