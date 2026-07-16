import {IconHandMove} from '@tabler/icons-react';
import {Card, Flex} from 'antd';
import {useTranslation} from 'react-i18next';

import inspectorStyles from '../SessionInspector.module.css';

/**
 * Title of the gestures tab card.
 */
const GesturesTabTitle = () => {
  const {t} = useTranslation();

  return (
    <Flex gap={4} align="center">
      <IconHandMove size={18} />
      {t('Saved Gestures')}
    </Flex>
  );
};

/**
 * Wrapper card for the gestures tab.
 */
const GesturesTabCard = ({children}) => (
  <Card title={<GesturesTabTitle />} className={inspectorStyles.interactionTabCard}>
    {children}
  </Card>
);

export default GesturesTabCard;
