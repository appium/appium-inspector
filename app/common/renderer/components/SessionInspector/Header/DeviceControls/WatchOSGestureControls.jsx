import {IconChevronDown, IconHandStop} from '@tabler/icons-react';
import {Button, Dropdown, Tooltip} from 'antd';
import {useState} from 'react';
import {useTranslation} from 'react-i18next';

import {
  XCUITEST_WATCHOS_GESTURES,
  XCUITEST_WATCHOS_MIN_EXTRA_GESTURES_VERSION,
} from '../../../../constants/driver-specific.js';

const getSupportedGestures = (platformVersion) => {
  const gestures = [XCUITEST_WATCHOS_GESTURES.DOUBLE_TAP];
  if (platformVersion >= XCUITEST_WATCHOS_MIN_EXTRA_GESTURES_VERSION) {
    gestures.push(XCUITEST_WATCHOS_GESTURES.FLICK);
  }
  return gestures;
};

/**
 * Button + dropdown to execute 'mobile: performHandGesture' in watchOS sessions.
 */
const WatchOSGestureControls = ({platformVersion, toDropdownItem, executeInteraction}) => {
  const {t} = useTranslation();
  const performGestureLabel = t('performHandGesture');

  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <Tooltip title={performGestureLabel} open={showTooltip} onOpenChange={setShowTooltip}>
      <Dropdown
        menu={{
          items: getSupportedGestures(platformVersion).map(toDropdownItem),
          onClick: ({key}) => executeInteraction('mobile:performHandGesture', {name: key}),
        }}
        placement="bottom"
        trigger="click"
        onOpenChange={() => setShowTooltip(false)}
      >
        <Button aria-label={performGestureLabel} style={{padding: 4, columnGap: 0}}>
          <IconHandStop size={18} />
          <IconChevronDown size={14} />
        </Button>
      </Dropdown>
    </Tooltip>
  );
};

export default WatchOSGestureControls;
