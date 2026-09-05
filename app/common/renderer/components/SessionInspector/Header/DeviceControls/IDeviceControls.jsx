import {
  IconChevronDown,
  IconDeviceMobile,
  IconDeviceRemote,
  IconDeviceWatch,
  IconHandStop,
  IconMessageChatbot,
} from '@tabler/icons-react';
import {Button, Dropdown, Space, Tooltip} from 'antd';
import {useTranslation} from 'react-i18next';

import {COMMAND_EXECUTE_SCRIPT} from '../../../../constants/commands.js';
import {PLATFORMS} from '../../../../constants/common.js';
import {
  XCUITEST_BUTTONS as BTNS,
  XCUITEST_WATCHOS_GESTURES as WATCHOS_GESTURES,
  XCUITEST_IOS_MIN_EXTRA_BUTTONS_VERSION,
  XCUITEST_TVOS_MIN_EXTRA_BUTTONS_VERSION,
  XCUITEST_WATCHOS_MIN_EXTRA_GESTURES_VERSION,
} from '../../../../constants/driver-specific.js';
import SiriCommandModal from './SiriCommandModal.jsx';

import inspectorStyles from '../../SessionInspector.module.css';

const toDropdownItem = (item) => ({
  key: item,
  label: <span className={inspectorStyles.monoFont}>{item}</span>,
});

const getIOSButtons = (platformVersion) => {
  const iosButtons = [BTNS.HOME, BTNS.VOLUME_UP, BTNS.VOLUME_DOWN];
  if (platformVersion >= XCUITEST_IOS_MIN_EXTRA_BUTTONS_VERSION) {
    iosButtons.push(BTNS.ACTION, BTNS.CAMERA);
  }
  return iosButtons;
};

const getTvOSButtons = (platformVersion) => {
  const tvOSButtons = [
    BTNS.HOME,
    BTNS.UP,
    BTNS.DOWN,
    BTNS.LEFT,
    BTNS.RIGHT,
    BTNS.MENU,
    BTNS.PLAY_PAUSE,
    BTNS.SELECT,
    BTNS.PAGE_UP,
    BTNS.PAGE_DOWN,
    BTNS.GUIDE,
  ];
  if (platformVersion >= XCUITEST_TVOS_MIN_EXTRA_BUTTONS_VERSION) {
    tvOSButtons.push(BTNS.FOUR_COLORS, BTNS.ONE_TWO_THREE, BTNS.TV_PROVIDER);
  }
  return tvOSButtons;
};

const getWatchOSButtons = () => [BTNS.HOME, BTNS.ACTION];

const getBtnDropdownItems = (platformName, platformVersion) => {
  let platformButtons = [];
  switch (platformName) {
    case PLATFORMS.IOS:
      platformButtons = getIOSButtons(platformVersion);
      break;
    case PLATFORMS.TVOS:
      platformButtons = getTvOSButtons(platformVersion);
      break;
    case PLATFORMS.WATCHOS:
      platformButtons = getWatchOSButtons();
  }
  return platformButtons.map(toDropdownItem);
};

const getGestureDropdownItems = (platformVersion) => {
  const supportedGestures = [WATCHOS_GESTURES.DOUBLE_TAP];
  if (platformVersion >= XCUITEST_WATCHOS_MIN_EXTRA_GESTURES_VERSION) {
    supportedGestures.push(WATCHOS_GESTURES.FLICK);
  }
  return supportedGestures.map(toDropdownItem);
};

const PressButtonIcon = ({platformName}) => {
  switch (platformName) {
    case PLATFORMS.IOS:
      return <IconDeviceMobile size={18} />;
    case PLATFORMS.TVOS:
      return <IconDeviceRemote size={18} />;
    case PLATFORMS.WATCHOS:
      return <IconDeviceWatch size={18} />;
  }
};

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
  const pressButtonLabel = t('pressDeviceButton');
  const performGestureLabel = t('performHandGesture');
  const siriLabel = t('Execute Siri Command');

  const platformName = featureCaps.platformName;
  const platformVersion = featureCaps.platformVersion;

  const executeInteraction = (methodName, itemName) => {
    applyClientMethod({
      methodName: COMMAND_EXECUTE_SCRIPT,
      args: [methodName, [{name: itemName}]],
    });
  };

  const onBtnDropdownItemClick = ({key}) => executeInteraction('mobile:pressButton', key);
  const onGestureDropdownItemClick = ({key}) => executeInteraction('mobile:performHandGesture', key);

  return (
    <>
      <Space.Compact>
        <Tooltip title={pressButtonLabel} placement="left">
          <Dropdown
            menu={{items: getBtnDropdownItems(platformName, platformVersion), onClick: onBtnDropdownItemClick}}
            trigger={['click']}
          >
            <Button aria-label={pressButtonLabel} style={{padding: 4, columnGap: 0}}>
              <PressButtonIcon platformName={platformName} />
              <IconChevronDown size={14} />
            </Button>
          </Dropdown>
        </Tooltip>
        {platformName === PLATFORMS.WATCHOS && (
          <Tooltip title={performGestureLabel} placement="left">
            <Dropdown
              menu={{items: getGestureDropdownItems(platformVersion), onClick: onGestureDropdownItemClick}}
              trigger={['click']}
            >
              <Button aria-label={performGestureLabel} style={{padding: 4, columnGap: 0}}>
                <IconHandStop size={18} />
                <IconChevronDown size={14} />
              </Button>
            </Dropdown>
          </Tooltip>
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
