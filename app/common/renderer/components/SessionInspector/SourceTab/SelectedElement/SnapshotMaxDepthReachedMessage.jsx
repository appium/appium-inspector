import {Alert, Col, Row} from 'antd';
import {useTranslation} from 'react-i18next';

import {ALERT, ROW} from '../../../../constants/antd-types.js';
import styles from '../Source.module.css';

/**
 * Info message shown when the selected element's path has reached the session's snapshotMaxDepth.
 */
const SnapshotMaxDepthReachedMessage = ({selectedElementPath, sessionSettings}) => {
  const {t} = useTranslation();
  const selectedElementDepth = selectedElementPath.split('.').length;

  if (selectedElementDepth === sessionSettings.snapshotMaxDepth) {
    return (
      <Row type={ROW.FLEX} gutter={10} className={styles.selectedElemInfoMessage}>
        <Col>
          <Alert
            type={ALERT.INFO}
            title={t('snapshotMaxDepthReached', {selectedElementDepth})}
            showIcon
          />
        </Col>
      </Row>
    );
  }
};

export default SnapshotMaxDepthReachedMessage;
