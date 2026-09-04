import {IconChevronLeft, IconCircle, IconHome, IconMessageChatbot, IconSquare} from '@tabler/icons-react';
import {Button, Space, Tooltip} from 'antd';
import {useTranslation} from 'react-i18next';

import {DRIVERS} from '../../../constants/common.js';
import SiriCommandModal from './SiriCommandModal.jsx';

/**
 * Device controls used for Android sessions.
 */
const AndroidControlsGroup = ({applyClientMethod}) => {
  const {t} = useTranslation();
  const backLabel = t('Press Back Button');
  const homeLabel = t('Press Home Button');
  const appSwitchLabel = t('Press App Switch Button');

  return (
    <Space.Compact>
      <Tooltip title={backLabel}>
        <Button
          aria-label={backLabel}
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
      <Tooltip title={homeLabel}>
        <Button
          aria-label={homeLabel}
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
      <Tooltip title={appSwitchLabel}>
        <Button
          aria-label={appSwitchLabel}
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
 * Device controls used for iOS/iPadOS/tvOS/watchOS sessions.
 */
const IDeviceControlsGroup = ({
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
                methodName: 'executeScript',
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

/**
 * Controls used for buttons on the device under test.
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
      <IDeviceControlsGroup
        applyClientMethod={applyClientMethod}
        showSiriCommandModal={showSiriCommandModal}
        siriCommandValue={siriCommandValue}
        setSiriCommandValue={setSiriCommandValue}
        isSiriCommandModalVisible={isSiriCommandModalVisible}
        hideSiriCommandModal={hideSiriCommandModal}
      />
    )}
    {[DRIVERS.UIAUTOMATOR2, DRIVERS.ESPRESSO].includes(featureCaps.automationName) && (
      <AndroidControlsGroup applyClientMethod={applyClientMethod} />
    )}
  </>
);

export default DeviceControlsGroup;
