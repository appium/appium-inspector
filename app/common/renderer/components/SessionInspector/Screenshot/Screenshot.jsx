import {Spin} from 'antd';
import {useCallback, useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';

import {WINDOW_DIMENSIONS} from '../../../constants/common.js';
import {MJPEG_STREAM_CHECK_INTERVAL} from '../../../constants/session-inspector.js';
import {debounce} from '../../../utils/common.js';
import styles from './Screenshot.module.css';
import ScreenshotControls from './ScreenshotControls.jsx';
import ScreenshotImgWithOverlays from './ScreenshotImgWithOverlays.jsx';

/**
 * Label shown when the screenshot could not be retrieved.
 */
const ScreenshotErrorLabel = ({screenshotError}) => {
  const {t} = useTranslation();

  return t('couldNotObtainScreenshot', {screenshotError});
};

/**
 * Spinner shown while the initial screenshot retrieval is in progress.
 */
const ScreenshotOuterSpinner = () => (
  <Spin size="large" spinning={true}>
    <div className={styles.screenshotBox} />
  </Spin>
);

// If the screenshot has too much space to the right or bottom, adjust the max width
// of its container, so the source tree always fills the remaining space.
// This keeps everything looking tight.
const updateScreenshotScale = (screenshotContainerElRef, setScaleRatio, windowSize) => {
  const screenshotContainer = screenshotContainerElRef.current;
  if (!screenshotContainer) {
    return;
  }

  const screenshotImg = screenshotContainer.querySelector('#screenshot');
  if (!screenshotImg) {
    return;
  }

  const imgRect = screenshotImg.getBoundingClientRect();
  const containerRect = screenshotContainer.getBoundingClientRect();
  if (imgRect.height < containerRect.height) {
    // get the expected image width if the image would fill the screenshot box height
    const attemptedImgWidth = (containerRect.height / imgRect.height) * imgRect.width;
    // get the maximum image width as a fraction of the current window width
    const maxImgWidth = window.innerWidth * WINDOW_DIMENSIONS.MAX_IMAGE_WIDTH_FRACTION;
    // make sure not to exceed both the maximum allowed width and the full screenshot width
    const curMaxImgWidth = Math.min(maxImgWidth, attemptedImgWidth, windowSize.width);
    screenshotContainer.style.maxWidth = `${curMaxImgWidth}px`;
  } else if (imgRect.width < containerRect.width) {
    screenshotContainer.style.maxWidth = `${imgRect.width}px`;
  }

  // Calculate the ratio for scaling items overlaid on the screenshot
  // (highlighter rectangles/circles, gestures, etc.)
  const newImgWidth = screenshotImg.getBoundingClientRect().width;
  setScaleRatio(windowSize.width / newImgWidth);
};

/**
 * Container that wraps the app screenshot, including screenshot interaction buttons
 * and handling for when the screenshot is not loaded
 */
const Screenshot = (props) => {
  const {
    showScreenshot,
    screenshotError,
    serverDetails,
    isUsingMjpegMode,
    isAwaitingMjpegStream,
    setAwaitingMjpegStream,
    windowSize,
  } = props;

  const screenshotContainerElRef = useRef(null);
  const mjpegStreamCheckIntervalRef = useRef(null);

  const [scaleRatio, setScaleRatio] = useState(1);

  const checkMjpegStream = useCallback(
    async (debouncedUpdateScale) => {
      const img = new Image();
      img.src = serverDetails.mjpegScreenshotUrl;
      let imgReady = false;
      try {
        await img.decode();
        imgReady = true;
      } catch {}
      if (imgReady && isAwaitingMjpegStream) {
        setAwaitingMjpegStream(false);
        debouncedUpdateScale();
        // stream obtained - can clear the refresh interval
        clearInterval(mjpegStreamCheckIntervalRef.current);
        mjpegStreamCheckIntervalRef.current = null;
      } else if (!imgReady && !isAwaitingMjpegStream) {
        setAwaitingMjpegStream(true);
      }
    },
    [isAwaitingMjpegStream, serverDetails.mjpegScreenshotUrl, setAwaitingMjpegStream],
  );

  /**
   * Ensures component dimensions are adjusted only once windowSize exists.
   */
  useEffect(() => {
    if (!windowSize || !JSON.stringify(windowSize)) {
      return;
    }
    const debouncedUpdateScale = debounce(() => {
      updateScreenshotScale(screenshotContainerElRef, setScaleRatio, windowSize);
    }, 50);
    debouncedUpdateScale();
    window.addEventListener('resize', debouncedUpdateScale);
    if (isUsingMjpegMode) {
      mjpegStreamCheckIntervalRef.current = setInterval(
        () => checkMjpegStream(debouncedUpdateScale),
        MJPEG_STREAM_CHECK_INTERVAL,
      );
    }
    return () => {
      window.removeEventListener('resize', debouncedUpdateScale);
      if (mjpegStreamCheckIntervalRef.current) {
        clearInterval(mjpegStreamCheckIntervalRef.current);
        mjpegStreamCheckIntervalRef.current = null;
      }
      debouncedUpdateScale.cancel?.();
    };
  }, [checkMjpegStream, isUsingMjpegMode, windowSize]);

  return (
    <div
      id="screenshotContainer"
      className={styles.screenshotContainer}
      ref={screenshotContainerElRef}
    >
      <ScreenshotControls {...props} />
      {showScreenshot && <ScreenshotImgWithOverlays {...props} scaleRatio={scaleRatio} />}
      {screenshotError && <ScreenshotErrorLabel screenshotError={screenshotError} />}
      {!showScreenshot && <ScreenshotOuterSpinner />}
    </div>
  );
};

export default Screenshot;
