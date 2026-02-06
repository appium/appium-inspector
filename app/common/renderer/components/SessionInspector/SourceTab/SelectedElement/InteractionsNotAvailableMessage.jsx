import {Alert, Col, Row} from 'antd';
import {useTranslation} from 'react-i18next';

import {ALERT, ROW} from '../../../../constants/antd-types.js';
import styles from './SelectedElement.module.css';

/**
 * Info message shown when the selected element does not support interactions,
 * most likely due to the app source having changed since the element was selected.
 */
const InteractionsNotAvailableMessage = ({elementInteractionsNotAvailable}) => {
  const {t} = useTranslation();

  if (!elementInteractionsNotAvailable) {
    return null;
  }
  return (
    <Row type={ROW.FLEX} gutter={10} className={styles.selectedElemInfoMessage}>
      <Col>
        <Alert type={ALERT.INFO} title={t('interactionsNotAvailable')} showIcon />
      </Col>
    </Row>
  );
};

export default InteractionsNotAvailableMessage;
