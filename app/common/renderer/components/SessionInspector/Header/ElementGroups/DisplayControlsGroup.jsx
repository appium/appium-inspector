import {IconCarouselHorizontal} from '@tabler/icons-react';
import {Button, Select, Space, Tooltip} from 'antd';
import {useTranslation} from 'react-i18next';

import {BUTTON} from '../../../../constants/antd-types.js';
import {DRIVERS} from '../../../../constants/common.js';

/**
 * Controls used to switch available displays (Android UiAutomator2 only)
 */
const DisplayControlsGroup = ({
  automationName,
  displays,
  currentDisplayId,
  setCurrentDisplayId,
  toggleMultiDisplayMode,
}) => {
  const {t} = useTranslation();

  return automationName === DRIVERS.UIAUTOMATOR2 ? (
    <Space.Compact>
      <Tooltip title={t('toggleMultiDisplayMode')}>
        <Button
          icon={<IconCarouselHorizontal size={18} />}
          type={displays ? BUTTON.PRIMARY : BUTTON.DEFAULT}
          onClick={() => toggleMultiDisplayMode(displays)}
        />
      </Tooltip>
      {displays && (
        <Select
          styles={{root: {width: 250}}}
          value={currentDisplayId}
          popupMatchSelectWidth={false}
          onChange={(value) => value !== currentDisplayId && setCurrentDisplayId(value)}
          options={displays.map(({id, name}) => ({
            value: id,
            label: name ? `${name} (ID ${id})` : id,
          }))}
        />
      )}
    </Space.Compact>
  ) : null;
};

export default DisplayControlsGroup;
