import {Empty, Space, Spin} from 'antd';
import {useTranslation} from 'react-i18next';

import styles from './AttachToSession.module.css';
import AttachToSessionInstructions from './AttachToSessionInstructions.jsx';
import DiscoveredSessions from './DiscoveredSessions.jsx';
import ManualIdInputAndRefreshBtn from './ManualIdInputAndRefreshBtn.jsx';

/**
 * The full Attach to Session tab.
 */
const AttachToSession = ({
  serverType,
  runningAppiumSessions,
  gettingSessions,
  getRunningSessions,
  loadNewSession,
}) => {
  const {t} = useTranslation();

  return (
    <Space className={styles.spaceContainer} orientation="vertical" size="large">
      <AttachToSessionInstructions />
      <ManualIdInputAndRefreshBtn
        loadNewSession={loadNewSession}
        getRunningSessions={getRunningSessions}
      />
      <Spin spinning={gettingSessions}>
        {runningAppiumSessions.length !== 0 ? (
          <DiscoveredSessions
            runningAppiumSessions={runningAppiumSessions}
            serverType={serverType}
            loadNewSession={loadNewSession}
          />
        ) : (
          <Empty description={t('noRunningSessionsFound')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Spin>
    </Space>
  );
};

export default AttachToSession;
