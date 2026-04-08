import {IconRefresh} from '@tabler/icons-react';
import {Button, Col, Row, Select, Tooltip} from 'antd';
import {useTranslation} from 'react-i18next';

import styles from './AttachToSession.module.css';

/**
 * Selection dropdown for all discovered sessions, and a button to refresh the session list.
 */
const DiscoveredSessions = ({
  attachSessId,
  setAttachSessId,
  getRunningSessions,
  sortedRunningSessions,
}) => {
  const {t} = useTranslation();

  return (
    <Row>
      <Col span={23}>
        <Select
          style={{width: '100%'}}
          showSearch
          placeholder={t('searchSessions')}
          value={attachSessId || undefined}
          onChange={(value) => setAttachSessId(value)}
          options={sortedRunningSessions}
        />
      </Col>
      <Col span={1}>
        <Tooltip title={t('Reload')}>
          <Button
            className={styles.btnReload}
            onClick={getRunningSessions}
            icon={<IconRefresh size={18} />}
          />
        </Tooltip>
      </Col>
    </Row>
  );
};

export default DiscoveredSessions;
