import {IconRecycle} from '@tabler/icons-react';
import {Button, Tooltip} from 'antd';
import {useTranslation} from 'react-i18next';

import {BUTTON} from '../../../constants/antd-types.js';

/**
 * Button used to reload the session.
 */
const SessionReloadButton = ({autoSessionRestart, toggleAutoSessionRestart}) => {
  const {t} = useTranslation();

  return (
    <Tooltip title={t('ToggleRestartSession')}>
      <Button
        aria-label={t('ToggleRestartSession')}
        id={autoSessionRestart ? 'btnDisableRestartSession' : 'btnEnableRestartSession'}
        icon={<IconRecycle size={16} />}
        type={autoSessionRestart ? BUTTON.PRIMARY : undefined}
        onClick={toggleAutoSessionRestart}
      />
    </Tooltip>
  );
};

export default SessionReloadButton;
