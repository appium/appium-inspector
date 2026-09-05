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
  XCUITEST_IOS_BUTTONS,
  XCUITEST_TVOS_BUTTONS,
  XCUITEST_WATCHOS_BUTTONS,
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

// Per-platform behavior lives here, so callers never need to branch on platformName themselves.
const PLATFORM_CONFIGS = {
  [PLATFORMS.IOS]: {
    icon: <IconDeviceMobile size={18} />,
    buttons: (platformVersion) => {
      const buttons = [XCUITEST_IOS_BUTTONS.HOME, XCUITEST_IOS_BUTTONS.VOLUME_UP, XCUITEST_IOS_BUTTONS.VOLUME_DOWN];
      if (platformVersion >= XCUITEST_IOS_MIN_EXTRA_BUTTONS_VERSION) {
        buttons.push(XCUITEST_IOS_BUTTONS.ACTION, XCUITEST_IOS_BUTTONS.CAMERA);
      }
      return buttons;
    },
  },

  [PLATFORMS.TVOS]: {
    icon: <IconDeviceRemote size={18} />,
    buttons: (platformVersion) => {
      const buttons = [
        XCUITEST_TVOS_BUTTONS.HOME,
        XCUITEST_TVOS_BUTTONS.UP,
        XCUITEST_TVOS_BUTTONS.DOWN,
        XCUITEST_TVOS_BUTTONS.LEFT,
        XCUITEST_TVOS_BUTTONS.RIGHT,
        XCUITEST_TVOS_BUTTONS.MENU,
        XCUITEST_TVOS_BUTTONS.PLAY_PAUSE,
        XCUITEST_TVOS_BUTTONS.SELECT,
        XCUITEST_TVOS_BUTTONS.PAGE_UP,
        XCUITEST_TVOS_BUTTONS.PAGE_DOWN,
        XCUITEST_TVOS_BUTTONS.GUIDE,
      ];
      if (platformVersion >= XCUITEST_TVOS_MIN_EXTRA_BUTTONS_VERSION) {
        buttons.push(
          XCUITEST_TVOS_BUTTONS.FOUR_COLORS,
          XCUITEST_TVOS_BUTTONS.ONE_TWO_THREE,
          XCUITEST_TVOS_BUTTONS.TV_PROVIDER,
        );
      }
      return buttons;
    },
  },

  [PLATFORMS.WATCHOS]: {
    icon: <IconDeviceWatch size={18} />,
    buttons: () => Object.values(XCUITEST_WATCHOS_BUTTONS),
    gestures: (platformVersion) => {
      const gestures = [WATCHOS_GESTURES.DOUBLE_TAP];
      if (platformVersion >= XCUITEST_WATCHOS_MIN_EXTRA_GESTURES_VERSION) {
        gestures.push(WATCHOS_GESTURES.FLICK);
      }
      return gestures;
    },
  },
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
  const platformConfig = PLATFORM_CONFIGS[platformName];

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
            menu={{
              items: platformConfig.buttons(platformVersion).map(toDropdownItem),
              onClick: onBtnDropdownItemClick,
            }}
            trigger={['click']}
          >
            <Button aria-label={pressButtonLabel} style={{padding: 4, columnGap: 0}}>
              {platformConfig.icon}
              <IconChevronDown size={14} />
            </Button>
          </Dropdown>
        </Tooltip>
        {platformName === PLATFORMS.WATCHOS && (
          <Tooltip title={performGestureLabel} placement="left">
            <Dropdown
              menu={{
                items: platformConfig.gestures(platformVersion).map(toDropdownItem),
                onClick: onGestureDropdownItemClick,
              }}
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
