import {IconTag} from '@tabler/icons-react';
import {Card, Flex} from 'antd';
import {useTranslation} from 'react-i18next';

import styles from './Source.module.css';

/**
 * Empty card shown in place of the Selected Element panel,
 * if no element is selected.
 */
const SelectAnElement = () => {
  const {t} = useTranslation();
  return (
    <Card
      title={
        <Flex gap={4} align="center">
          <IconTag size={18} />
          {t('selectedElement')}
        </Flex>
      }
      className={styles.selectedElementCard}
    >
      <i>{t('selectElementInSource')}</i>
    </Card>
  );
};

export default SelectAnElement;
