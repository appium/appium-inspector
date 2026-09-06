import {Splitter} from 'antd';
import {useCallback, useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router';

import {WINDOW_DIMENSIONS} from '../../constants/common.js';
import HeaderButtons from './Header/HeaderButtons.jsx';
import Screenshot from './Screenshot/Screenshot.jsx';
import SessionExpiryModal from './SessionExpiryModal.jsx';
import SessionInspectorTabs from './SessionInspectorTabs.jsx';

import styles from './SessionInspector.module.css';

const MAX_SCREENSHOT_WIDTH_PERCENT = `${WINDOW_DIMENSIONS.MAX_SCREENSHOT_PANEL_WIDTH_FRACTION * 100}%`;

// resize width to something sensible for using the inspector on first run
const resizeWindowOnLaunch = () => {
  const curHeight = window.innerHeight;
  const curWidth = window.innerWidth;
  if (curHeight < WINDOW_DIMENSIONS.MIN_HEIGHT || curWidth < WINDOW_DIMENSIONS.MIN_WIDTH) {
    const newWidth = curWidth < WINDOW_DIMENSIONS.MIN_WIDTH ? WINDOW_DIMENSIONS.MIN_WIDTH : curWidth;
    const newHeight = curHeight < WINDOW_DIMENSIONS.MIN_HEIGHT ? WINDOW_DIMENSIONS.MIN_HEIGHT : curHeight;
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

  const [screenshotPanelWidth, setScreenshotPanelWidth] = useState(WINDOW_DIMENSIONS.INITIAL_SCREENSHOT_PANEL_WIDTH_PX);
  const screenshotPanelResizedManually = useRef(false);

  // Triggered when the width of the scaled image or Inspector window changes.
  const setPanelWidthAutomatically = (suggestedWidth) => {
    setScreenshotPanelWidth((curWidth) => {
      if (screenshotPanelResizedManually.current) {
        // re-enforce the same limits that are already set for Splitter.Panel,
        // otherwise the panel can go outside these bounds upon Inspector window size change
        const maxPanelSize = window.innerWidth * WINDOW_DIMENSIONS.MAX_SCREENSHOT_PANEL_WIDTH_FRACTION;
        return Math.min(Math.max(curWidth, WINDOW_DIMENSIONS.MIN_IMG_WIDTH_PX), maxPanelSize);
      }
      // ignore sub-pixel differences to avoid a resizing loop
      return Math.abs(suggestedWidth - curWidth) < 1 ? curWidth : suggestedWidth;
    });
  };

  // Triggered when manually adjusting the splitter. Only needed to trip the manual resize flag.
  const setPanelWidthManually = (widths) => {
    screenshotPanelResizedManually.current = true;
    setScreenshotPanelWidth(widths[0]);
  };

  const quitSessionAndReturn = useCallback(
    async ({reason, manualQuit = true, detachOnly = false} = {}) => {
      await quitSession({reason, manualQuit, detachOnly});
      navigate('/session', {replace: true});
    },
    [navigate, quitSession],
  );

  const showScreenshot =
    (screenshot && !screenshotError) || (isUsingMjpegMode && (!isSourceRefreshOn || !isAwaitingMjpegStream));

  useEffect(() => {
    resizeWindowOnLaunch();
    applyClientMethod({methodName: 'getPageSource'});
    storeSessionSettings();
    getSavedClientFramework();
    runKeepAliveLoop();
    setSessionTime(Date.now());
  }, [applyClientMethod, getSavedClientFramework, runKeepAliveLoop, setSessionTime, storeSessionSettings]);

  return (
    <div className={styles.inspectorContainer}>
      <HeaderButtons {...props} quitSessionAndReturn={quitSessionAndReturn} />
      <Splitter className={styles.inspectorSplitter} onResize={setPanelWidthManually}>
        <Splitter.Panel
          min={WINDOW_DIMENSIONS.MIN_IMG_WIDTH_PX}
          max={MAX_SCREENSHOT_WIDTH_PERCENT}
          size={screenshotPanelWidth}
        >
          <Screenshot
            {...props}
            showScreenshot={showScreenshot}
            screenshotPanelWidth={screenshotPanelWidth}
            suggestScreenshotPanelWidth={setPanelWidthAutomatically}
          />
        </Splitter.Panel>
        <Splitter.Panel>
          <SessionInspectorTabs {...props} showScreenshot={showScreenshot} />
        </Splitter.Panel>
      </Splitter>
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
