import {Spin} from 'antd';
import {useCallback, useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';

import {WINDOW_DIMENSIONS} from '../../../constants/common.js';
import {MJPEG_STREAM_CHECK_INTERVAL} from '../../../constants/session-inspector.js';
import {debounce} from '../../../utils/common.js';
import ScreenshotControls from './ScreenshotControls.jsx';
import ScreenshotImgWithOverlays from './ScreenshotImgWithOverlays.jsx';

import styles from './Screenshot.module.css';

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

// The image itself is scaled purely via CSS ('object-fit: contain' on the <img>), filling whatever
// space the (resizable) screenshot panel currently has. Here we compute the same fit from the
// content area's own dimensions and the device's aspect ratio - scaled to fit the available
// height, capped to a fraction of the window - to report the panel's natural initial width,
// and compute the ratio for scaling items overlaid on the screenshot (highlighter rectangles, etc.)
const updateScreenshotScale = (
  screenshotContentElRef,
  setScaleRatio,
  windowSize,
  screenshotPanelSize,
  onScreenshotSizingChange,
) => {
  const screenshotContent = screenshotContentElRef.current;
  if (!screenshotContent) {
    return;
  }

  const availableWidth = screenshotContent.clientWidth;
  const availableHeight = screenshotContent.clientHeight;
  if (!availableWidth || !availableHeight) {
    return;
  }

  const deviceAspectRatio = windowSize.width / windowSize.height;
  // the width the image would need in order to fill the available height, preserving aspect ratio
  const heightFitWidth = availableHeight * deviceAspectRatio;
  const maxImageWidthFraction = window.innerWidth * WINDOW_DIMENSIONS.MAX_IMAGE_WIDTH_FRACTION;
  const naturalWidth = Math.min(heightFitWidth, maxImageWidthFraction, windowSize.width);
  // the Splitter's own resize bar eats into the panel's requested size, so the content area ends
  // up narrower than what was asked for - compensate by requesting that difference again on top
  const splitterOverhead = screenshotPanelSize - availableWidth;
  onScreenshotSizingChange(naturalWidth + splitterOverhead);

  // the image itself never renders wider than the available width or the height-fit width
  const renderedWidth = Math.min(availableWidth, heightFitWidth);
  setScaleRatio(windowSize.width / renderedWidth);
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
    screenshotPanelSize,
    onScreenshotSizingChange,
  } = props;

  const screenshotContentElRef = useRef(null);
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
   * Reacts both to window resizes and to the screenshot panel being resized via the Splitter
   * (which does not trigger a window 'resize' event).
   */
  useEffect(() => {
    if (!windowSize || !JSON.stringify(windowSize)) {
      return;
    }
    const debouncedUpdateScale = debounce(() => {
      updateScreenshotScale(
        screenshotContentElRef,
        setScaleRatio,
        windowSize,
        screenshotPanelSize,
        onScreenshotSizingChange,
      );
    }, 50);
    debouncedUpdateScale();
    window.addEventListener('resize', debouncedUpdateScale);
    const resizeObserver = new ResizeObserver(debouncedUpdateScale);
    if (screenshotContentElRef.current) {
      resizeObserver.observe(screenshotContentElRef.current);
    }
    if (isUsingMjpegMode) {
      mjpegStreamCheckIntervalRef.current = setInterval(
        () => checkMjpegStream(debouncedUpdateScale),
        MJPEG_STREAM_CHECK_INTERVAL,
      );
    }
    return () => {
      window.removeEventListener('resize', debouncedUpdateScale);
      resizeObserver.disconnect();
      if (mjpegStreamCheckIntervalRef.current) {
        clearInterval(mjpegStreamCheckIntervalRef.current);
        mjpegStreamCheckIntervalRef.current = null;
      }
      debouncedUpdateScale.cancel?.();
    };
  }, [checkMjpegStream, isUsingMjpegMode, onScreenshotSizingChange, screenshotPanelSize, windowSize]);

  return (
    <div id="screenshotContainer" className={styles.screenshotContainer}>
      <ScreenshotControls {...props} />
      <div className={styles.screenshotContent} ref={screenshotContentElRef}>
        {showScreenshot && <ScreenshotImgWithOverlays {...props} scaleRatio={scaleRatio} />}
        {screenshotError && <ScreenshotErrorLabel screenshotError={screenshotError} />}
        {!showScreenshot && <ScreenshotOuterSpinner />}
      </div>
    </div>
  );
};

export default Screenshot;
