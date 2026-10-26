import {useEffect, useRef} from 'react';
import {useTranslation} from 'react-i18next';

import {handleInspectorShortcut} from '../../utils/inspector-shortcuts.js';

const InspectorShortcuts = ({children, className, ...props}) => {
  const {t} = useTranslation();
  const container = useRef(null);

  useEffect(() => {
    const element = container.current;
    if (element && element.ownerDocument.activeElement === element.ownerDocument.body) {
      element.focus({preventScroll: true});
    }
  }, []);

  const handleKeyDown = (event) => {
    const {
      driver,
      methodCallInProgress,
      isQuittingSession,
      isSessionDone,
      isLocatorSearchModalVisible,
      showKeepAlivePrompt,
      isGestureEditorVisible,
      applyClientMethod,
      showLocatorSearchModal,
      isRecording,
      pauseRecording,
      startRecording,
    } = props;
    if (
      !driver ||
      methodCallInProgress ||
      isQuittingSession ||
      isSessionDone ||
      isLocatorSearchModalVisible ||
      showKeepAlivePrompt ||
      isGestureEditorVisible
    ) {
      return;
    }
    handleInspectorShortcut(event, {
      KeyR: () => applyClientMethod({methodName: 'getPageSource'}),
      KeyL: showLocatorSearchModal,
      KeyV: isRecording ? pauseRecording : startRecording,
    });
  };

  return (
    <div
      ref={container}
      className={className}
      role="region"
      aria-label={t('appiumInspector')}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );
};

export default InspectorShortcuts;
