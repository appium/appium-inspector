import {useEffect} from 'react';

import {handleInspectorShortcut} from '../../utils/inspector-shortcuts.js';

import styles from './SessionInspector.module.css';

/**
 * Listen for keyboard shortcuts anywhere in the Session Inspector.
 */
const InspectorShortcuts = ({
  children,
  applyClientMethod,
  showLocatorSearchModal,
  isRecording,
  startRecording,
  pauseRecording,
}) => {
  useEffect(() => {
    const actions = {
      KeyR: () => applyClientMethod({methodName: 'getPageSource'}),
      KeyF: showLocatorSearchModal,
      KeyV: isRecording ? pauseRecording : startRecording,
    };
    const onKeyDown = (event) => handleInspectorShortcut(event, actions);
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [applyClientMethod, showLocatorSearchModal, isRecording, startRecording, pauseRecording]);

  return <div className={styles.inspectorContainer}>{children}</div>;
};

export default InspectorShortcuts;
