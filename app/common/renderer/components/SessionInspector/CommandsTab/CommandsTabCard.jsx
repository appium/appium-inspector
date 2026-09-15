import {IconTerminal} from '@tabler/icons-react';
import {Card, Flex} from 'antd';
import {useTranslation} from 'react-i18next';

/**
 * Title of the commands tab card.
 */
const CommandsTabTitle = () => {
  const {t} = useTranslation();

  return (
    <Flex gap={4} align="center">
      <IconTerminal size={18} />
      {t('Execute Commands')}
    </Flex>
  );
};

/**
 * Wrapper card for the commands tab.
 */
const CommandsTabCard = ({children}) => (
  <Card
    title={<CommandsTabTitle />}
    styles={{
      header: {padding: '0px 8px 0px 16px', minHeight: '48px'},
      body: {padding: '0px 12px 12px 12px', height: 'calc(100% - 48px)'},
    }}
  >
    {children}
  </Card>
);

export default CommandsTabCard;
