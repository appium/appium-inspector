import {Col, Row} from 'antd';

import DiscoveredSessionCard from './DiscoveredSessionCard.jsx';

/**
 * Grid container for all discovered sessions.
 */
const DiscoveredSessions = ({runningAppiumSessions, serverType, loadNewSession}) => {
  // list is reversed in order to place the most recent sessions at the top
  const sortedRunningSessions = [...runningAppiumSessions].reverse();

  return (
    <Row gutter={[12, 12]}>
      {sortedRunningSessions.map((session) => (
        <Col xs={12} sm={12} md={12} lg={12} xl={8} xxl={6} key={session.id}>
          <DiscoveredSessionCard
            session={session}
            serverType={serverType}
            loadNewSession={loadNewSession}
          />
        </Col>
      ))}
    </Row>
  );
};

export default DiscoveredSessions;
