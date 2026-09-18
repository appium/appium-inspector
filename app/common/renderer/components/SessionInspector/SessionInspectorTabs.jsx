import {Tabs, Tooltip} from 'antd';
import {useEffect, useRef, useState} from 'react';
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

// Used for calculating item widths for tabs that use a grid, like Commands and Gesture Editor
const calculateItemColspan = (breakpoints, curTabWidth) => {
  if (!curTabWidth) {
    return 1;
  }
  for (const entry of breakpoints) {
    if (curTabWidth <= entry.maxWidth) {
      return entry.colspan;
    }
  }
};

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

  const tabsContainerRef = useRef(null);
  const [tabWidth, setTabWidth] = useState(null);

  // Disable the Gestures tab on unsupported platforms
  const areW3CActionsUnsupported = PLATFORMS_WITHOUT_W3C_ACTIONS.includes(featureCaps.platformName);

  const getItemColspan = (breakpoints) => calculateItemColspan(breakpoints, tabWidth);

  const inspectorTabItems = [
    {
      label: t('Source'),
      key: INSPECTOR_TABS.SOURCE,
      disabled: !showScreenshot,
      children: <SourceTab {...props} tabWidth={tabWidth} />,
    },
    {
      label: t('Commands'),
      key: INSPECTOR_TABS.COMMANDS,
      disabled: !showScreenshot,
      children: (
        <Commands
          applyClientMethod={applyClientMethod}
          getSupportedSessionMethods={getSupportedSessionMethods}
          getItemColspan={getItemColspan}
        />
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
      children: isGestureEditorVisible ? (
        <GestureEditor {...props} getItemColspan={getItemColspan} />
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

  // Single location for keeping track of the tab width, regardless of which one is active
  useEffect(() => {
    const container = tabsContainerRef.current;
    if (!container) {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0) {
        setTabWidth(entry.contentRect.width);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.inspectorTabsContainer} ref={tabsContainerRef}>
      <Tabs
        styles={{header: {margin: '0px 0px 1em 6px'}, item: {padding: '10px 0px 10px 0px'}}}
        activeKey={selectedInspectorTab}
        size="small"
        onChange={(tab) => selectInspectorTab(tab)}
        items={inspectorTabItems}
      />
    </div>
  );
};

export default SessionInspectorTabs;
