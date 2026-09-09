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
// as well as the scale ratio of the raw screenshot width to its target rendered width,
// which is used to position screenshot overlay items like highlighters and gesture trails.
// The image itself is rescaled purely using CSS.
const updateScreenshotScale = ({sizes, setScaleRatio, suggestScreenshotPanelWidth}) => {
  if (!sizes.screenshotContent || !sizes.image) {
    return;
  }

  const availableWidth = sizes.screenshotContent.clientWidth;
  const availableHeight = sizes.screenshotContent.clientHeight;
  if (!availableWidth || !availableHeight) {
    return;
  }

  // viewport can have a different ratio from the image (e.g. for webviews), so use the image itself
  const imageWidthToFitHeight = (availableHeight * sizes.image.naturalWidth) / sizes.image.naturalHeight;
  const maxAllowedImageWidth = window.innerWidth * WINDOW_DIMENSIONS.MAX_IMG_WIDTH_FRACTION;
  // check image width too, since it may be the smallest (e.g. for smartwatches)
  const bestFitWidth = Math.min(imageWidthToFitHeight, maxAllowedImageWidth, sizes.image.naturalWidth);
  // the Splitter's own resize bar eats into the panel's requested size, so the content area
  // ends up slightly narrower than requested - add that difference
  const splitterOverhead = sizes.screenshotPanelWidth - availableWidth;
  suggestScreenshotPanelWidth(bestFitWidth + splitterOverhead);
  // scale ratio is specific to the viewport, so use its width
  const renderedWidth = Math.min(availableWidth, imageWidthToFitHeight);
  setScaleRatio(sizes.viewport.width / renderedWidth);
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

  const imageElRef = useRef(null);
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

  // set up triggers for recalculating the screenshot image scaling factor, upon changes in size
  // for the raw image, MJPEG stream, screenshot panel, and the Inspector window
  useEffect(() => {
    if (!windowSize?.width || !windowSize?.height) {
      return;
    }
    const debouncedUpdateScale = debounce(() => {
      updateScreenshotScale({
        sizes: {
          viewport: windowSize,
          image: imageElRef.current,
          screenshotContent: screenshotContentElRef.current,
          screenshotPanelWidth,
        },
        setScaleRatio,
        suggestScreenshotPanelWidth,
      });
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
        {showScreenshot && <ScreenshotImgWithOverlays {...props} scaleRatio={scaleRatio} imageElRef={imageElRef} />}
        {screenshotError && <ScreenshotErrorLabel screenshotError={screenshotError} />}
        {!showScreenshot && <ScreenshotOuterSpinner />}
      </div>
    </div>
  );
};

export default Screenshot;
