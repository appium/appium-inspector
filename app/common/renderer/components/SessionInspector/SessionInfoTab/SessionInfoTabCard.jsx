import {IconInfoCircle} from '@tabler/icons-react';
import {Card, Flex} from 'antd';
import {useTranslation} from 'react-i18next';

/**
 * Title of the session information tab card.
 */
const SessionInfoTabTitle = () => {
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
const SessionInfoTabCard = ({children}) => (
  <Card
    title={<SessionInfoTabTitle />}
    styles={{
      header: {marginBottom: '0px', padding: '0px 8px 0px 16px', minHeight: '48px'},
      body: {overflow: 'scroll', padding: '12px', height: 'calc(100% - 48px)'},
    }}
  >
    {children}
  </Card>
);

export default SessionInfoTabCard;
