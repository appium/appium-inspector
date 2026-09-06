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

// Calculate the target screenshot panel width (unless changed manually),
// as well as the scale ratio of the original screenshot width to its target rendered width,
// which is used to position screenshot overlay items like highlighters and gesture trails.
// The image itself is rescaled purely using CSS. Scale calculation depends on the original image dimensions,
// the width of the screenshot panel, and the width/height of the entire Inspector window.
const updateScreenshotScale = (
  screenshotContentElRef,
  setScaleRatio,
  rawImageSize,
  screenshotPanelWidth,
  suggestScreenshotPanelWidth,
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

  const imageWidthToFitHeight = (availableHeight * rawImageSize.width) / rawImageSize.height;
  const maxAllowedImageWidth = window.innerWidth * WINDOW_DIMENSIONS.MAX_IMG_WIDTH_FRACTION;
  // check rawImageSize width too, since it may be the smallest (e.g. for smartwatches)
  const bestFitWidth = Math.min(imageWidthToFitHeight, maxAllowedImageWidth, rawImageSize.width);
  // the Splitter's own resize bar eats into the panel's requested size, so the content area
  // ends up slightly narrower than requested - add that difference
  const splitterOverhead = screenshotPanelWidth - availableWidth;
  suggestScreenshotPanelWidth(bestFitWidth + splitterOverhead);
  // users are allowed to set the screenshot container width to exceed the image width
  // (the image size stops increasing once height-bound),
  // so for the scale ratio, use the container-available and height-fit widths
  const renderedWidth = Math.min(availableWidth, imageWidthToFitHeight);
  setScaleRatio(rawImageSize.width / renderedWidth);
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
    screenshotPanelWidth,
    suggestScreenshotPanelWidth,
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

  // set up triggers for recalculating of the screenshot image scaling factor:
  // changes in size for the raw image, MJPEG stream, screenshot panel, and the Inspector window
  useEffect(() => {
    if (!windowSize || !JSON.stringify(windowSize)) {
      return;
    }
    const debouncedUpdateScale = debounce(() => {
      updateScreenshotScale(
        screenshotContentElRef,
        setScaleRatio,
        windowSize,
        screenshotPanelWidth,
        suggestScreenshotPanelWidth,
      );
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
  }, [checkMjpegStream, isUsingMjpegMode, suggestScreenshotPanelWidth, screenshotPanelWidth, windowSize]);

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
