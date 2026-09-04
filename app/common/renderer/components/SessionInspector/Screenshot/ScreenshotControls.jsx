import {
  IconCrosshair,
  IconDownload,
  IconEyePlus,
  IconMovie,
  IconObjectScan,
  IconPhoto,
  IconSquarePlus,
} from '@tabler/icons-react';
import {Button, Space, Tooltip} from 'antd';
import {useTranslation} from 'react-i18next';

import {BUTTON} from '../../../constants/antd-types.js';
import {SCREENSHOT_INTERACTION_MODE} from '../../../constants/screenshot.js';
import {downloadFile} from '../../../utils/file-handling.js';

import styles from './Screenshot.module.css';

const {SELECT, TAP_SWIPE, TAP_ELEMENT} = SCREENSHOT_INTERACTION_MODE;

const downloadScreenshot = (screenshot) => {
  const href = `data:image/png;base64,${screenshot}`;
  const filename = `appium-inspector-${new Date().toJSON()}.png`;
  downloadFile(href, filename);
};

/**
 * Button for switching between MJPEG and regular screenshot capture mode.
 * Only shown if the session was started in MJPEG mode.
 */
const ScreenshotCaptureModeControls = ({setMjpegState, isUsingMjpegMode, setRefreshingState, applyClientMethod}) => {
  const {t} = useTranslation();
  const useMjpegLabel = t('useMjpegStream');
  const useScreenshotLabel = t('useScreenshotApi');

  const switchScreenCaptureMode = (shouldUseMjpeg) => {
    setMjpegState(shouldUseMjpeg);
    if (!shouldUseMjpeg) {
      setRefreshingState({source: true});
    }
    applyClientMethod({methodName: 'getPageSource'});
  };

  return (
    <Space.Compact>
      <Tooltip title={useMjpegLabel} placement="topLeft">
        <Button
          aria-label={useMjpegLabel}
          icon={<IconMovie size={18} />}
          onClick={() => switchScreenCaptureMode(true)}
          type={isUsingMjpegMode ? BUTTON.PRIMARY : BUTTON.DEFAULT}
        />
      </Tooltip>
      <Tooltip title={useScreenshotLabel} placement="topLeft">
        <Button
          aria-label={useScreenshotLabel}
          icon={<IconPhoto size={18} />}
          onClick={() => switchScreenCaptureMode(false)}
          type={!isUsingMjpegMode ? BUTTON.PRIMARY : BUTTON.DEFAULT}
        />
      </Tooltip>
    </Space.Compact>
  );
};

/**
 * Button for toggling visibility of element handles (+/- centroids).
 */
const ToggleElementHandlesButton = ({showCentroids, toggleShowCentroids, isGestureEditorVisible}) => {
  const {t} = useTranslation();
  const toggleHandlesLabel = showCentroids ? t('Hide Element Handles') : t('Show Element Handles');

  return (
    <Tooltip title={toggleHandlesLabel}>
      <Button
        aria-label={toggleHandlesLabel}
        icon={<IconEyePlus size={18} />}
        onClick={() => toggleShowCentroids()}
        type={showCentroids ? BUTTON.PRIMARY : BUTTON.DEFAULT}
        disabled={isGestureEditorVisible}
      />
    </Tooltip>
  );
};

/**
 * Button allowing to switch between the Element Mode, Tap By Element Mode, and
 * Coordinates Mode when interacting with the screenshot.
 */
const ScreenshotInteractionModeControls = ({
  screenshotInteractionMode,
  selectScreenshotInteractionMode,
  clearCoordAction,
  isGestureEditorVisible,
}) => {
  const {t} = useTranslation();
  const selectElemLabel = t('Select Elements');
  const tapElemLabel = t('Tap By Element');
  const tapCoordsLabel = t('Tap/Swipe By Coordinates');

  const screenshotInteractionChange = (mode) => {
    clearCoordAction(); // When the action changes, reset the swipe action
    selectScreenshotInteractionMode(mode);
  };

  return (
    <Space.Compact>
      <Tooltip title={selectElemLabel}>
        <Button
          aria-label={selectElemLabel}
          icon={<IconObjectScan size={18} />}
          onClick={() => screenshotInteractionChange(SELECT)}
          type={screenshotInteractionMode === SELECT ? BUTTON.PRIMARY : BUTTON.DEFAULT}
          disabled={isGestureEditorVisible}
        />
      </Tooltip>
      <Tooltip title={tapElemLabel}>
        <Button
          aria-label={tapElemLabel}
          icon={<IconSquarePlus size={18} />}
          onClick={() => screenshotInteractionChange(TAP_ELEMENT)}
          type={screenshotInteractionMode === TAP_ELEMENT ? BUTTON.PRIMARY : BUTTON.DEFAULT}
          disabled={isGestureEditorVisible}
        />
      </Tooltip>
      <Tooltip title={tapCoordsLabel}>
        <Button
          aria-label={tapCoordsLabel}
          icon={<IconCrosshair size={18} />}
          onClick={() => screenshotInteractionChange(TAP_SWIPE)}
          type={screenshotInteractionMode === TAP_SWIPE ? BUTTON.PRIMARY : BUTTON.DEFAULT}
          disabled={isGestureEditorVisible}
        />
      </Tooltip>
    </Space.Compact>
  );
};

/**
 * Button for downloading the current screenshot as a PNG file.
 */
const DownloadScreenshotButton = ({screenshot, showScreenshot, isUsingMjpegMode}) => {
  const {t} = useTranslation();
  const downloadLabel = t('Download Screenshot');

  return (
    <Tooltip title={downloadLabel}>
      <Button
        aria-label={downloadLabel}
        icon={<IconDownload size={18} />}
        onClick={() => downloadScreenshot(screenshot)}
        disabled={!showScreenshot || isUsingMjpegMode}
      />
    </Tooltip>
  );
};

/**
 * Control buttons shown above the app screenshot.
 */
const ScreenshotControls = (props) => {
  const {
    screenshot,
    screenshotInteractionMode,
    selectScreenshotInteractionMode,
    showScreenshot,
    serverDetails,
    isUsingMjpegMode,
    setMjpegState,
    setRefreshingState,
    toggleShowCentroids,
    showCentroids,
    isGestureEditorVisible,
    clearCoordAction,
    applyClientMethod,
  } = props;

  return (
    <div className={styles.screenshotControls}>
      <Space size="small">
        {serverDetails.mjpegScreenshotUrl != null && (
          <ScreenshotCaptureModeControls
            setMjpegState={setMjpegState}
            isUsingMjpegMode={isUsingMjpegMode}
            setRefreshingState={setRefreshingState}
            applyClientMethod={applyClientMethod}
          />
        )}
        <ToggleElementHandlesButton
          showCentroids={showCentroids}
          toggleShowCentroids={toggleShowCentroids}
          isGestureEditorVisible={isGestureEditorVisible}
        />
        <ScreenshotInteractionModeControls
          screenshotInteractionMode={screenshotInteractionMode}
          selectScreenshotInteractionMode={selectScreenshotInteractionMode}
          clearCoordAction={clearCoordAction}
          isGestureEditorVisible={isGestureEditorVisible}
        />
        <DownloadScreenshotButton
          screenshot={screenshot}
          showScreenshot={showScreenshot}
          isUsingMjpegMode={isUsingMjpegMode}
        />
      </Space>
    </div>
  );
};

export default ScreenshotControls;
