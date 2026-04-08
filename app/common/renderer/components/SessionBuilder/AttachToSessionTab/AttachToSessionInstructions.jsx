import {Card, Form} from 'antd';
import {useTranslation} from 'react-i18next';

import builderStyles from '../SessionBuilder.module.css';

/**
 * Instructions describing the purpose and usage of the attach to session tab.
 */
const AttachToSessionInstructions = () => {
  const {t} = useTranslation();

  return (
    <Form.Item>
      <Card>
        <p className={builderStyles.localDesc}>
          {t('connectToExistingSessionInstructions')}
          <br />
          {t('selectSessionID')}
        </p>
      </Card>
    </Form.Item>
  );
};

export default AttachToSessionInstructions;
