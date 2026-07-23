import {useCallback, useEffect} from 'react';
import {useNavigate} from 'react-router';

import {WINDOW_DIMENSIONS} from '../../constants/common.js';
import HeaderButtons from './Header/HeaderButtons.jsx';
import ScreenshotContainer from './Screenshot/ScreenshotContainer.jsx';
import SessionExpiryModal from './SessionExpiryModal.jsx';
import styles from './SessionInspector.module.css';
import SessionInspectorTabs from './SessionInspectorTabs.jsx';

// resize width to something sensible for using the inspector on first run
const resizeWindowOnLaunch = () => {
  const curHeight = window.innerHeight;
  const curWidth = window.innerWidth;
  if (curHeight < WINDOW_DIMENSIONS.MIN_HEIGHT || curWidth < WINDOW_DIMENSIONS.MIN_WIDTH) {
    const newWidth =
      curWidth < WINDOW_DIMENSIONS.MIN_WIDTH ? WINDOW_DIMENSIONS.MIN_WIDTH : curWidth;
    const newHeight =
      curHeight < WINDOW_DIMENSIONS.MIN_HEIGHT ? WINDOW_DIMENSIONS.MIN_HEIGHT : curHeight;
    window.resizeTo(newWidth, newHeight);
  }
};

/**
 * The root component of the Session Inspector screen.
 */
const Inspector = (props) => {
  const {
    screenshot,
    screenshotError,
    isUsingMjpegMode,
    isAwaitingMjpegStream,
    isSourceRefreshOn,
    quitSession,
    setUserWaitTimeout,
    showKeepAlivePrompt,
    keepSessionAlive,
    applyClientMethod,
    getSavedClientFramework,
    runKeepAliveLoop,
    setSessionTime,
    storeSessionSettings,
  } = props;

  const navigate = useNavigate();

  const quitSessionAndReturn = useCallback(
    async ({reason, manualQuit = true, detachOnly = false} = {}) => {
      await quitSession({reason, manualQuit, detachOnly});
      navigate('/session', {replace: true});
    },
    [navigate, quitSession],
  );

  const showScreenshot =
    (screenshot && !screenshotError) ||
    (isUsingMjpegMode && (!isSourceRefreshOn || !isAwaitingMjpegStream));

  useEffect(() => {
    resizeWindowOnLaunch();
    applyClientMethod({methodName: 'getPageSource'});
    storeSessionSettings();
    getSavedClientFramework();
    runKeepAliveLoop();
    setSessionTime(Date.now());
  }, [
    applyClientMethod,
    getSavedClientFramework,
    runKeepAliveLoop,
    setSessionTime,
    storeSessionSettings,
  ]);

  return (
    <div className={styles.inspectorContainer}>
      <HeaderButtons {...props} quitSessionAndReturn={quitSessionAndReturn} />
      <div className={styles.inspectorMain}>
        <ScreenshotContainer {...props} showScreenshot={showScreenshot} />
        <SessionInspectorTabs {...props} showScreenshot={showScreenshot} />
      </div>
      <SessionExpiryModal
        showKeepAlivePrompt={showKeepAlivePrompt}
        keepSessionAlive={keepSessionAlive}
        quitSessionAndReturn={quitSessionAndReturn}
        setUserWaitTimeout={setUserWaitTimeout}
      />
    </div>
  );
};

export default Inspector;
