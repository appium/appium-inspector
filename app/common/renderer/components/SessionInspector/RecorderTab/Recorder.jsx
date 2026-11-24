import {Flex, Typography} from 'antd';
import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Refractor} from 'react-refractor';

import {CLIENT_FRAMEWORK_MAP} from '../../../lib/client-frameworks/map.js';
import {controlRecording, listRecordings, originOfServerUrl} from '../../../utils/server-recordings.js';
import {RecordingControls, RecordingStatusTag} from '../../SessionBuilder/RecordingsTab/Recordings.jsx';
import RecorderTabCard from './RecorderTabCard.jsx';

import inspectorStyles from '../SessionInspector.module.css';
import styles from './Recorder.module.css';

const SERVER_SYNC_INTERVAL_MS = 2000;
const SERVER_STATUS_INTERVAL_MS = 3000;

/**
 * Whether the Inspector Appium plugin is recording this session on the server, with a pause/resume
 * control. Shows nothing when the server has no recorder (plugin missing or recording disabled).
 */
const ServerRecordingStatus = ({serverUrl, sessionId}) => {
  const {t} = useTranslation();
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!serverUrl || !sessionId) {
      return;
    }
    let cancelled = false;
    const origin = originOfServerUrl(serverUrl);
    const poll = async () => {
      try {
        const rec = (await listRecordings(origin)).find((r) => r.sessionId === sessionId);
        if (!cancelled) {
          setStatus(rec ? {...rec, origin} : null);
        }
      } catch {
        if (!cancelled) {
          setStatus(null);
        }
      }
    };
    void poll();
    const timer = setInterval(() => void poll(), SERVER_STATUS_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [serverUrl, sessionId]);

  if (!status) {
    return null;
  }
  const control = async (rec, action) => {
    try {
      setStatus({...(await controlRecording(status.origin, sessionId, action)), origin: status.origin});
    } catch {
      // the next poll shows the real state
    }
  };
  return (
    <Flex align="center" gap={8} className={styles.serverStatus}>
      <RecordingStatusTag recording={status} />
      {status.state !== 'idle' && (
        <Typography.Text type="secondary">{t('serverRecordingSteps', {count: status.steps})}</Typography.Text>
      )}
      <RecordingControls recording={status} control={control} size="small" />
    </Flex>
  );
};

/**
 * Contents of the recorder tab.
 */
const Recorder = (props) => {
  const {
    showBoilerplate,
    recordedActions,
    clientFramework,
    serverDetails,
    sessionCaps,
    setClientFramework,
    toggleShowBoilerplate,
    clearRecording,
    loadServerRecording,
    downloadServerLocators,
    driver,
  } = props;
  const {t} = useTranslation();
  const [isServerSyncOn, setIsServerSyncOn] = useState(false);

  // While live sync is on, keep showing what the Inspector plugin recorded on the server for this
  // session (commands from any client, e.g. an AI agent working through an MCP server).
  useEffect(() => {
    if (!isServerSyncOn) {
      return;
    }
    let cancelled = false;
    const poll = async (quiet) => {
      const ok = await loadServerRecording({quiet});
      if (!ok && !quiet && !cancelled) {
        setIsServerSyncOn(false);
      }
    };
    void poll(false);
    const timer = setInterval(() => poll(true), SERVER_SYNC_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [isServerSyncOn, loadServerRecording]);

  const {serverUrl, serverUrlParts} = serverDetails;
  const ClientFrameworkClass = CLIENT_FRAMEWORK_MAP[clientFramework];

  const framework = new ClientFrameworkClass(serverUrl, serverUrlParts, sessionCaps);
  framework.actions = recordedActions;
  const clientCode = framework.getCodeString(showBoilerplate);

  return (
    <div style={{height: '100%', overflowX: 'scroll'}}>
      <RecorderTabCard
        clientFramework={clientFramework}
        clientCode={clientCode}
        recordedActions={recordedActions}
        setClientFramework={setClientFramework}
        showBoilerplate={showBoilerplate}
        toggleShowBoilerplate={toggleShowBoilerplate}
        clearRecording={clearRecording}
        loadServerRecording={loadServerRecording}
        downloadServerLocators={downloadServerLocators}
        isServerSyncOn={isServerSyncOn}
        toggleServerSync={() => setIsServerSyncOn((on) => !on)}
      >
        <ServerRecordingStatus serverUrl={serverUrl} sessionId={driver?.sessionId} />
        {!recordedActions.length && (
          <div className={styles.noRecordedActions}>{t('enableRecordingAndPerformActions')}</div>
        )}
        {!!recordedActions.length && (
          <Refractor
            className={`refractor ${inspectorStyles.clientCode}`}
            language={ClientFrameworkClass.refractorLang}
            value={clientCode}
          />
        )}
      </RecorderTabCard>
    </div>
  );
};

export default Recorder;
