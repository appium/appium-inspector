import {Form, Spin} from 'antd';

import {getSessionInfo} from '../../../utils/attaching-to-session.js';
import AttachToSessionInstructions from './AttachToSessionInstructions.jsx';
import DiscoveredSessions from './DiscoveredSessions.jsx';
import ManualSessionIdInput from './ManualSessionIdInput.jsx';
import NoSessionsDiscovered from './NoSessionsDiscovered.jsx';

/**
 * The full Attach to Session tab.
 */
const AttachToSession = ({
  serverType,
  attachSessId,
  setAttachSessId,
  runningAppiumSessions,
  gettingSessions,
  getRunningSessions,
  loadNewSession,
}) => {
  // list is reversed in order to place the most recent sessions at the top
  // slice() is added because reverse() mutates the original array
  const sortedRunningSessions = [...runningAppiumSessions]
    .reverse()
    .map((session) => ({value: session.id, label: getSessionInfo(session, serverType)}));

  return (
    <Form>
      <AttachToSessionInstructions />
      <ManualSessionIdInput loadNewSession={loadNewSession} />
      <Spin spinning={gettingSessions}>
        {sortedRunningSessions.length !== 0 ? (
          <DiscoveredSessions
            attachSessId={attachSessId}
            setAttachSessId={setAttachSessId}
            getRunningSessions={getRunningSessions}
            sortedRunningSessions={sortedRunningSessions}
          />
        ) : (
          <NoSessionsDiscovered getRunningSessions={getRunningSessions} />
        )}
      </Spin>
    </Form>
  );
};

export default AttachToSession;
