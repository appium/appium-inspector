import {Input, Switch} from 'antd';

import {INPUT} from '../../constants/antd-types';
import {CAPABILITY_TYPES} from '../../constants/session-builder';
import SessionStyles from './Session.module.css';

const CapabilityControl = ({
  cap,
  onSetCapabilityParam,
  onPressEnter,
  isEditingDesiredCaps,
  id,
  t,
}) => {
  switch (cap.type) {
    case CAPABILITY_TYPES.TEXT:
    case CAPABILITY_TYPES.FILE:
      return (
        <Input
          disabled={isEditingDesiredCaps}
          id={id}
          placeholder={t('Value')}
          value={cap.value}
          onChange={(e) => onSetCapabilityParam(e.target.value)}
          onPressEnter={onPressEnter}
          className={SessionStyles.capsBoxFont}
        />
      );
    case CAPABILITY_TYPES.BOOL:
      return (
        <Switch
          disabled={isEditingDesiredCaps}
          id={id}
          checkedChildren={'true'}
          unCheckedChildren={'false'}
          placeholder={t('Value')}
          checked={cap.value}
          onChange={(value) => onSetCapabilityParam(value)}
        />
      );
    case CAPABILITY_TYPES.NUM:
      return (
        <Input
          disabled={isEditingDesiredCaps}
          id={id}
          placeholder={t('Value')}
          value={cap.value}
          onChange={(e) =>
            !isNaN(parseInt(e.target.value, 10))
              ? onSetCapabilityParam(parseInt(e.target.value, 10))
              : onSetCapabilityParam(undefined)
          }
          onPressEnter={onPressEnter}
          className={SessionStyles.capsBoxFont}
        />
      );
    case CAPABILITY_TYPES.OBJECT:
    case CAPABILITY_TYPES.JSON_OBJECT:
      return (
        <Input
          disabled={isEditingDesiredCaps}
          id={id}
          type={INPUT.TEXTAREA}
          rows={4}
          placeholder={t('Value')}
          value={cap.value}
          onChange={(e) => onSetCapabilityParam(e.target.value)}
          className={SessionStyles.capsBoxFont}
        />
      );
    default:
      throw new Error(t('invalidCapType', {type: cap.type}));
  }
};

export default CapabilityControl;
