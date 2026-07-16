import {IconTerminal} from '@tabler/icons-react';
import {Card, Flex} from 'antd';
import {useTranslation} from 'react-i18next';

import inspectorStyles from '../SessionInspector.module.css';

/**
 * Title of the commands tab card.
 */
const CommandsPanelTitle = () => {
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
const CommandsCard = ({children}) => (
  <Card title={<CommandsPanelTitle />} className={inspectorStyles.interactionTabCard}>
    {children}
  </Card>
);

export default CommandsCard;
