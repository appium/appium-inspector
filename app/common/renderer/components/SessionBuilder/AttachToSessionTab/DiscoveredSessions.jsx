import {Col, Row, Select} from 'antd';
import {useTranslation} from 'react-i18next';

/**
 * Selection dropdown for all discovered sessions.
 */
const DiscoveredSessions = ({attachSessId, setAttachSessId, sortedRunningSessions}) => {
  const {t} = useTranslation();

  return (
    <Row>
      <Col span={24}>
        <Select
          style={{width: '100%'}}
          showSearch
          placeholder={t('searchSessions')}
          value={attachSessId || undefined}
          onChange={(value) => setAttachSessId(value)}
          options={sortedRunningSessions}
        />
      </Col>
    </Row>
  );
};

export default DiscoveredSessions;
