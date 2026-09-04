import {IconHome, IconMessageChatbot} from '@tabler/icons-react';
import {Button, Space, Tooltip} from 'antd';
import {useTranslation} from 'react-i18next';

import {COMMAND_EXECUTE_SCRIPT} from '../../../../constants/commands.js';
import SiriCommandModal from './SiriCommandModal.jsx';

/**
 * Device controls used for iOS/iPadOS/tvOS/watchOS sessions.
 */
const IDeviceControls = ({
  applyClientMethod,
  showSiriCommandModal,
  siriCommandValue,
  setSiriCommandValue,
  isSiriCommandModalVisible,
  hideSiriCommandModal,
}) => {
  const {t} = useTranslation();
  const homeLabel = t('Press Home Button');
  const siriLabel = t('Execute Siri Command');

  return (
    <>
      <Space.Compact>
        <Tooltip title={homeLabel}>
          <Button
            aria-label={homeLabel}
            id="btnPressHomeButton"
            icon={<IconHome size={18} />}
            onClick={() =>
              applyClientMethod({
                methodName: COMMAND_EXECUTE_SCRIPT,
                args: ['mobile:pressButton', [{name: 'home'}]],
              })
            }
          />
        </Tooltip>
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
