import {Tabs, Tooltip} from 'antd';
import {useTranslation} from 'react-i18next';

import {PLATFORMS_WITHOUT_W3C_ACTIONS} from '../../constants/common.js';
import {INSPECTOR_TABS} from '../../constants/session-inspector.js';
import Commands from './CommandsTab/Commands.jsx';
import GestureEditor from './GesturesTab/GestureEditor/GestureEditor.jsx';
import SavedGestures from './GesturesTab/SavedGestures.jsx';
import Recorder from './RecorderTab/Recorder.jsx';
import SessionInfo from './SessionInfoTab/SessionInfo.jsx';
import SourceTab from './SourceTab/SourceTab.jsx';

import styles from './SessionInspector.module.css';

/**
 * Tabs shown to the right of the screenshot on the Session Inspector screen.
 */
const SessionInspectorTabs = (props) => {
  const {
    selectedInspectorTab,
    selectInspectorTab,
    isGestureEditorVisible,
    showScreenshot,
    applyClientMethod,
    getSupportedSessionMethods,
    featureCaps,
  } = props;

  const {t} = useTranslation();

  // Disable the Gestures tab on unsupported platforms
  const areW3CActionsUnsupported = PLATFORMS_WITHOUT_W3C_ACTIONS.includes(featureCaps.platformName);

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
      children: (
        <Commands applyClientMethod={applyClientMethod} getSupportedSessionMethods={getSupportedSessionMethods} />
      ),
    },
    {
      label: areW3CActionsUnsupported ? (
        <Tooltip title={t('w3cActionsUnsupported')} placement="bottom">
          {t('Gestures')}
        </Tooltip>
      ) : (
        t('Gestures')
      ),
      key: INSPECTOR_TABS.GESTURES,
      disabled: areW3CActionsUnsupported || !showScreenshot,
      children: isGestureEditorVisible ? <GestureEditor {...props} /> : <SavedGestures {...props} />,
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
