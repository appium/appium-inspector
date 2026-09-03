import {IconPlugConnectedX, IconX} from '@tabler/icons-react';
import {Button, Space, Tooltip} from 'antd';
import {useTranslation} from 'react-i18next';

/**
 * Controls used to quit the session.
 */
const SessionQuitControlsGroup = ({quitSessionAndReturn}) => {
  const {t} = useTranslation();
  const detachLabel = t('detachFromSession');
  const quitLabel = t('Quit Session');

  return (
    <Space.Compact>
      <Tooltip title={detachLabel}>
        <Button
          aria-label={detachLabel}
          id="btnDetach"
          icon={<IconPlugConnectedX size={18} />}
          onClick={() => quitSessionAndReturn({detachOnly: true})}
        />
      </Tooltip>
      <Tooltip title={quitLabel}>
        <Button aria-label={quitLabel} id="btnClose" icon={<IconX size={18} />} onClick={quitSessionAndReturn} />
      </Tooltip>
    </Space.Compact>
  );
};

export default SessionQuitControlsGroup;
