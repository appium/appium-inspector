import {Card} from 'antd';
import {useTranslation} from 'react-i18next';

import builderStyles from '../SessionBuilder.module.css';

/**
 * Instructions describing the purpose and usage of the attach to session tab.
 */
const AttachToSessionInstructions = () => {
  const {t} = useTranslation();

  return (
    <Card styles={{body: {padding: '6px 8px 12px 8px'}}}>
      <p className={builderStyles.localDesc}>
        {t('connectToExistingSessionInstructions')}
        <br />
        {t('selectSessionID')}
      </p>
    </Card>
  );
};

export default AttachToSessionInstructions;
