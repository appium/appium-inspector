import {useEffect} from 'react';

import {handleInspectorShortcut} from '../../utils/inspector-shortcuts.js';

/** Listen for shortcuts anywhere in the window while the Inspector is mounted. */
const InspectorShortcuts = ({
  children,
  className,
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

  return <div className={className}>{children}</div>;
};

export default InspectorShortcuts;
