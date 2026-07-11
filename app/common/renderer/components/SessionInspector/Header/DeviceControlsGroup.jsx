import {
  IconChevronLeft,
  IconCircle,
  IconHome,
  IconMessageChatbot,
  IconSquare,
} from '@tabler/icons-react';
import {Button, Space, Tooltip} from 'antd';
import {useTranslation} from 'react-i18next';

import SiriCommandModal from './SiriCommandModal.jsx';

/**
 * Device controls used for Android sessions.
 */
const AndroidControlsGroup = ({applyClientMethod}) => {
  const {t} = useTranslation();

  return (
    <Space.Compact>
      <Tooltip title={t('Press Back Button')}>
        <Button
          id="btnPressBackButton"
          icon={<IconChevronLeft size={20} />}
          onClick={() =>
            applyClientMethod({
              methodName: 'executeScript',
              args: ['mobile:pressKey', [{keycode: 4}]],
            })
          }
        />
      </Tooltip>
      <Tooltip title={t('Press Home Button')}>
        <Button
          id="btnPressHomeButton"
          icon={<IconCircle size={16} />}
          onClick={() =>
            applyClientMethod({
              methodName: 'executeScript',
              args: ['mobile:pressKey', [{keycode: 3}]],
            })
          }
        />
      </Tooltip>
      <Tooltip title={t('Press App Switch Button')}>
        <Button
          id="btnPressAppSwitchButton"
          icon={<IconSquare size={16} />}
          onClick={() =>
            applyClientMethod({
              methodName: 'executeScript',
              args: ['mobile:pressKey', [{keycode: 187}]],
            })
          }
        />
      </Tooltip>
    </Space.Compact>
  );
};

/**
 * Device controls used for iOS sessions.
 */
const IosControlsGroup = ({
  applyClientMethod,
  showSiriCommandModal,
  siriCommandValue,
  setSiriCommandValue,
  isSiriCommandModalVisible,
  hideSiriCommandModal,
}) => {
  const {t} = useTranslation();

  return (
    <Space.Compact>
      <Tooltip title={t('Press Home Button')}>
        <Button
          id="btnPressHomeButton"
          icon={<IconHome size={18} />}
          onClick={() =>
            applyClientMethod({
              methodName: 'executeScript',
              args: ['mobile:pressButton', [{name: 'home'}]],
            })
          }
        />
      </Tooltip>
      <Tooltip title={t('Execute Siri Command')}>
        <Button
          id="siriCommand"
          icon={<IconMessageChatbot size={18} />}
          onClick={showSiriCommandModal}
        />
      </Tooltip>
      <SiriCommandModal
        siriCommandValue={siriCommandValue}
        setSiriCommandValue={setSiriCommandValue}
        isSiriCommandModalVisible={isSiriCommandModalVisible}
        applyClientMethod={applyClientMethod}
        hideSiriCommandModal={hideSiriCommandModal}
      />
    </Space.Compact>
  );
};

/**
 * Controls used for buttons on the device under test.
 */
const DeviceControlsGroup = ({
  driver,
  applyClientMethod,
  showSiriCommandModal,
  siriCommandValue,
  setSiriCommandValue,
  isSiriCommandModalVisible,
  hideSiriCommandModal,
}) =>
  driver && (
    <>
      {driver.isIOS && (
        <IosControlsGroup
          applyClientMethod={applyClientMethod}
          showSiriCommandModal={showSiriCommandModal}
          siriCommandValue={siriCommandValue}
          setSiriCommandValue={setSiriCommandValue}
          isSiriCommandModalVisible={isSiriCommandModalVisible}
          hideSiriCommandModal={hideSiriCommandModal}
        />
      )}
      {driver.isAndroid && <AndroidControlsGroup applyClientMethod={applyClientMethod} />}
    </>
  );

export default DeviceControlsGroup;
