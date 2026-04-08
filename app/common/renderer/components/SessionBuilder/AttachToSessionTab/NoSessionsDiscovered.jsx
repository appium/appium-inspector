import {IconRefresh} from '@tabler/icons-react';
import {Button, Empty} from 'antd';
import {useTranslation} from 'react-i18next';

/**
 * Message and refresh button shown when no running sessions are discovered.
 */
const NoSessionsDiscovered = ({getRunningSessions}) => {
  const {t} = useTranslation();

  return (
    <Empty description={t('noRunningSessionsFound')} image={Empty.PRESENTED_IMAGE_SIMPLE}>
      <Button onClick={getRunningSessions} icon={<IconRefresh size={18} />}>
        {t('Reload')}
      </Button>
    </Empty>
  );
};

export default NoSessionsDiscovered;
