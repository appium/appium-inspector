import {Card} from 'antd';
import {useTranslation} from 'react-i18next';

import builderStyles from '../SessionBuilder.module.css';

/**
 * Instructions describing the purpose and usage of the attach to session tab.
 */
const AttachToSessionInstructions = () => {
  const {t} = useTranslation();

  return (
    <Card>
      <p className={builderStyles.localDesc}>
        {t('connectToExistingSessionInstructions')}
        <br />
        {t('selectSessionID')}
      </p>
    </Card>
  );
};

export default AttachToSessionInstructions;
