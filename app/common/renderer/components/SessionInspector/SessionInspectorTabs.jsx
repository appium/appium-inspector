import {Tabs} from 'antd';
import {useTranslation} from 'react-i18next';

import {INSPECTOR_TABS} from '../../constants/session-inspector.js';
import Commands from './CommandsTab/Commands.jsx';
import GestureEditor from './GesturesTab/GestureEditor/GestureEditor.jsx';
import SavedGestures from './GesturesTab/SavedGestures.jsx';
import Recorder from './RecorderTab/Recorder.jsx';
import SessionInfo from './SessionInfoTab/SessionInfo.jsx';
import styles from './SessionInspector.module.css';
import SourceTab from './SourceTab/SourceTab.jsx';

/**
 * Tabs shown to the right of the screenshot on the Session Inspector screen.
 */
const SessionInspectorTabs = (props) => {
  const {selectedInspectorTab, selectInspectorTab, isGestureEditorVisible, showScreenshot} = props;

  const {t} = useTranslation();

  const inspectorTabItems = [
    {
      label: t('Source'),
      key: INSPECTOR_TABS.SOURCE,
      disabled: !showScreenshot,
      children: <SourceTab {...props} />,
    },
    {
      label: t('Commands'),
      key: INSPECTOR_TABS.COMMANDS,
      disabled: !showScreenshot,
      children: <Commands {...props} />,
    },
    {
      label: t('Gestures'),
      key: INSPECTOR_TABS.GESTURES,
      disabled: !showScreenshot,
      children: isGestureEditorVisible ? (
        <GestureEditor {...props} />
      ) : (
        <SavedGestures {...props} />
      ),
    },
    {
      label: t('Recorder'),
      key: INSPECTOR_TABS.RECORDER,
      disabled: !showScreenshot,
      children: <Recorder {...props} />,
    },
    {
      label: t('Session Information'),
      key: INSPECTOR_TABS.SESSION_INFO,
      disabled: !showScreenshot,
      children: <SessionInfo {...props} />,
    },
  ];

  return (
    <div className={styles.inspectorTabsContainer}>
      <Tabs
        activeKey={selectedInspectorTab}
        size="small"
        onChange={(tab) => selectInspectorTab(tab)}
        items={inspectorTabItems}
      />
    </div>
  );
};

export default SessionInspectorTabs;
