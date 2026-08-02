import {IconPlugConnectedX, IconX} from '@tabler/icons-react';
import {Button, Space, Tooltip} from 'antd';
import {useTranslation} from 'react-i18next';

/**
 * Controls used to quit the session.
 */
const SessionQuitControlsGroup = ({quitSessionAndReturn}) => {
  const {t} = useTranslation();

  return (
    <Space.Compact>
      <Tooltip title={t('detachFromSession')}>
        <Button
          aria-label={t('detachFromSession')}
          id="btnDetach"
          icon={<IconPlugConnectedX size={18} />}
          onClick={() => quitSessionAndReturn({detachOnly: true})}
        />
      </Tooltip>
      <Tooltip title={t('Quit Session')}>
        <Button
          aria-label={t('Quit Session')}
          id="btnClose"
          icon={<IconX size={18} />}
          onClick={quitSessionAndReturn}
        />
      </Tooltip>
    </Space.Compact>
  );
};

export default SessionQuitControlsGroup;
