import {IconInfoCircle} from '@tabler/icons-react';
import {Card, Flex} from 'antd';
import {useTranslation} from 'react-i18next';

import inspectorStyles from '../SessionInspector.module.css';

/**
 * Title of the session information tab card.
 */
const SessionInfoPanelTitle = () => {
  const {t} = useTranslation();

  return (
    <Flex gap={4} align="center">
      <IconInfoCircle size={18} />
      {t('Session Information')}
    </Flex>
  );
};

/**
 * Wrapper card for the session information tab.
 */
const SessionInfoCard = ({children}) => (
  <Card title={<SessionInfoPanelTitle />} className={inspectorStyles.interactionTabCard}>
    {children}
  </Card>
);

export default SessionInfoCard;
