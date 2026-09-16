import {IconHandMove} from '@tabler/icons-react';
import {Card, Flex} from 'antd';
import {useTranslation} from 'react-i18next';

/**
 * Title of the gesture editor card.
 */
const GestureEditorTitle = () => {
  const {t} = useTranslation();

  return (
    <Flex gap={4} align="center">
      <IconHandMove size={18} />
      {t('Gesture Builder')}
    </Flex>
  );
};

/**
 * Wrapper card for the gesture editor.
 */
const GestureEditorCard = ({children}) => (
  <Card
    title={<GestureEditorTitle />}
    styles={{
      header: {padding: '0px 8px 0px 16px', minHeight: '48px'},
      body: {display: 'flex', flexFlow: 'column', padding: '12px', height: 'calc(100% - 48px)'},
    }}
  >
    {children}
  </Card>
);

export default GestureEditorCard;
