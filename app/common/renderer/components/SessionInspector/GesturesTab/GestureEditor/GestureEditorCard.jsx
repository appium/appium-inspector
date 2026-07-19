import {IconHandMove} from '@tabler/icons-react';
import {Card, Flex} from 'antd';
import {useTranslation} from 'react-i18next';

import inspectorStyles from '../../SessionInspector.module.css';

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
  <Card title={<GestureEditorTitle />} className={inspectorStyles.interactionTabCard}>
    {children}
  </Card>
);

export default GestureEditorCard;
