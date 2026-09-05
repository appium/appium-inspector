import {
  IconChevronDown,
  IconDeviceMobile,
  IconDeviceRemote,
  IconDeviceWatch,
  IconMessageChatbot,
} from '@tabler/icons-react';
import {Button, Dropdown, Space, Tooltip} from 'antd';
import {useTranslation} from 'react-i18next';

import {COMMAND_EXECUTE_SCRIPT} from '../../../../constants/commands.js';
import {PLATFORMS} from '../../../../constants/common.js';
import SiriCommandModal from './SiriCommandModal.jsx';

import inspectorStyles from '../../SessionInspector.module.css';

/**
 * All supported values for the 'mobile: pressButton' extension.
 * The Inspector only applies constraints for the device category and OS version:
 * limitations for Xcode, device model and simulator/real device currently cannot be implemented
 * @see https://appium.github.io/appium-xcuitest-driver/latest/reference/execute-methods/#mobile-pressbutton
 */
const BTNS = {
  // All devices
  HOME: 'home',
  // iOS 16+ and watchOS 9+ supported devices only
  ACTION: 'action',
  // iOS real devices only
  VOLUME_UP: 'volumeup',
  VOLUME_DOWN: 'volumedown',
  // iOS 16+ supported real devices only
  CAMERA: 'camera',
  // tvOS only
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
  MENU: 'menu',
  PLAY_PAUSE: 'playpause',
  SELECT: 'select',
  PAGE_UP: 'pageup',
  PAGE_DOWN: 'pagedown',
  GUIDE: 'guide',
  // tvOS 18.1+ only
  FOUR_COLORS: 'fourcolors',
  ONE_TWO_THREE: 'onetwothree',
  TV_PROVIDER: 'tvprovider',
};

const getIOSButtons = (platformVersion) => {
  const iosButtons = [BTNS.HOME, BTNS.VOLUME_UP, BTNS.VOLUME_DOWN];
  if (platformVersion >= 16) {
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
  if (platformVersion >= 18.1) {
    tvOSButtons.push(BTNS.FOUR_COLORS, BTNS.ONE_TWO_THREE, BTNS.TV_PROVIDER);
  }
  return tvOSButtons;
};

const getWatchOSButtons = () => [BTNS.HOME, BTNS.ACTION];

const getButtonNames = (platformName, platformVersion) => {
  switch (platformName) {
    case PLATFORMS.IOS:
      return getIOSButtons(platformVersion);
    case PLATFORMS.TVOS:
      return getTvOSButtons(platformVersion);
    case PLATFORMS.WATCHOS:
      return getWatchOSButtons();
  }
};

const getDropdownItems = (platformName, platformVersion) =>
  getButtonNames(platformName, platformVersion).map((btn) => ({
    key: btn,
    label: <span className={inspectorStyles.monoFont}>{btn}</span>,
  }));

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
  const pressButtonLabel = t('Press Button');
  const siriLabel = t('Execute Siri Command');

  const platformName = featureCaps.platformName;
  const platformVersion = featureCaps.platformVersion;

  const onDropdownItemClick = ({key}) => {
    applyClientMethod({
      methodName: COMMAND_EXECUTE_SCRIPT,
      args: ['mobile:pressButton', [{name: key}]],
    });
  };

  return (
    <>
      <Space.Compact>
        <Tooltip title={pressButtonLabel} placement="left">
          <Dropdown
            menu={{items: getDropdownItems(platformName, platformVersion), onClick: onDropdownItemClick}}
            trigger={['click']}
          >
            <Button aria-label={pressButtonLabel} style={{padding: 4, columnGap: 0}}>
              <PressButtonIcon platformName={platformName} />
              <IconChevronDown size={14} />
            </Button>
          </Dropdown>
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
