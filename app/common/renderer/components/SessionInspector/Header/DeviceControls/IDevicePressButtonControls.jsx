import {IconChevronDown, IconDeviceMobile, IconDeviceRemote, IconDeviceWatch} from '@tabler/icons-react';
import {Button, Dropdown, Tooltip} from 'antd';
import {useState} from 'react';
import {useTranslation} from 'react-i18next';

import {PLATFORMS} from '../../../../constants/common.js';
import {
  XCUITEST_IOS_BUTTONS,
  XCUITEST_TVOS_BUTTONS,
  XCUITEST_WATCHOS_BUTTONS,
  XCUITEST_IOS_MIN_EXTRA_BUTTONS_VERSION,
  XCUITEST_TVOS_MIN_EXTRA_BUTTONS_VERSION,
} from '../../../../constants/driver-specific.js';

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
  },
};

/**
 * Button + dropdown to execute 'mobile: pressButton' in iOS/iPadOS/tvOS/watchOS sessions.
 */
const IDevicePressButtonControls = ({featureCaps, toDropdownItem, executeInteraction}) => {
  const {t} = useTranslation();
  const pressButtonLabel = t('pressDeviceButton');

  const [showTooltip, setShowTooltip] = useState(false);

  const platformConfig = PLATFORM_CONFIGS[featureCaps.platformName];

  return (
    <Tooltip title={pressButtonLabel} open={showTooltip} onOpenChange={setShowTooltip}>
      <Dropdown
        menu={{
          items: platformConfig.buttons(featureCaps.platformVersion).map(toDropdownItem),
          onClick: ({key}) => executeInteraction('mobile:pressButton', {name: key}),
        }}
        placement="bottom"
        trigger="click"
        onOpenChange={() => setShowTooltip(false)}
      >
        <Button aria-label={pressButtonLabel} style={{padding: 4, columnGap: 0}}>
          {platformConfig.icon}
          <IconChevronDown size={14} />
        </Button>
      </Dropdown>
    </Tooltip>
  );
};

export default IDevicePressButtonControls;
