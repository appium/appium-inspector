import {Empty, Space, Spin} from 'antd';
import {useTranslation} from 'react-i18next';

import {getSessionInfo} from '../../../utils/attaching-to-session.js';
import styles from './AttachToSession.module.css';
import AttachToSessionInstructions from './AttachToSessionInstructions.jsx';
import DiscoveredSessions from './DiscoveredSessions.jsx';
import ManualIdInputAndRefreshBtn from './ManualIdInputAndRefreshBtn.jsx';

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
  const {t} = useTranslation();
  // list is reversed in order to place the most recent sessions at the top
  // slice() is added because reverse() mutates the original array
  const sortedRunningSessions = [...runningAppiumSessions]
    .reverse()
    .map((session) => ({value: session.id, label: getSessionInfo(session, serverType)}));

  return (
    <Space className={styles.spaceContainer} orientation="vertical" size="large">
      <AttachToSessionInstructions />
      <ManualIdInputAndRefreshBtn
        loadNewSession={loadNewSession}
        getRunningSessions={getRunningSessions}
      />
      <Spin spinning={gettingSessions}>
        {sortedRunningSessions.length !== 0 ? (
          <DiscoveredSessions
            attachSessId={attachSessId}
            setAttachSessId={setAttachSessId}
            sortedRunningSessions={sortedRunningSessions}
          />
        ) : (
          <Empty description={t('noRunningSessionsFound')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Spin>
    </Space>
  );
};

export default AttachToSession;
