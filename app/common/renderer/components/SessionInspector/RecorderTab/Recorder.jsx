import {useTranslation} from 'react-i18next';
import {Refractor} from 'react-refractor';

import {CLIENT_FRAMEWORK_MAP} from '../../../lib/client-frameworks/map.js';
import styles from './Recorder.module.css';
import RecorderCard from './RecorderCard.jsx';

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
  } = props;
  const {t} = useTranslation();

  const {serverUrl, serverUrlParts} = serverDetails;
  const ClientFrameworkClass = CLIENT_FRAMEWORK_MAP[clientFramework];

  const framework = new ClientFrameworkClass(serverUrl, serverUrlParts, sessionCaps);
  framework.actions = recordedActions;
  const clientCode = framework.getCodeString(showBoilerplate);

  return (
    <RecorderCard
      clientFramework={clientFramework}
      clientCode={clientCode}
      recordedActions={recordedActions}
      setClientFramework={setClientFramework}
      showBoilerplate={showBoilerplate}
      toggleShowBoilerplate={toggleShowBoilerplate}
      clearRecording={clearRecording}
    >
      {!recordedActions.length && (
        <div className={styles.noRecordedActions}>{t('enableRecordingAndPerformActions')}</div>
      )}
      {!!recordedActions.length && (
        <Refractor language={ClientFrameworkClass.refractorLang} value={clientCode} />
      )}
    </RecorderCard>
  );
};

export default Recorder;
