import {IconHandMove} from '@tabler/icons-react';
import {Card, Flex} from 'antd';
import {useTranslation} from 'react-i18next';

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
  <Card
    title={<GesturesTabTitle />}
    styles={{
      header: {padding: '0px 8px 0px 16px', minHeight: '48px'},
      body: {padding: '12px', height: 'calc(100% - 48px)'},
    }}
  >
    {children}
  </Card>
);

export default GesturesTabCard;
