import {
  IconCrosshair,
  IconDownload,
  IconEyePlus,
  IconMovie,
  IconObjectScan,
  IconPhoto,
} from '@tabler/icons-react';
import {Button, Space, Tooltip} from 'antd';
import {useTranslation} from 'react-i18next';

import {BUTTON} from '../../../constants/antd-types.js';
import {SCREENSHOT_INTERACTION_MODE} from '../../../constants/screenshot.js';
import {downloadFile} from '../../../utils/file-handling.js';
import styles from './Screenshot.module.css';

const {SELECT, TAP_SWIPE} = SCREENSHOT_INTERACTION_MODE;

const downloadScreenshot = (screenshot) => {
  const href = `data:image/png;base64,${screenshot}`;
  const filename = `appium-inspector-${new Date().toJSON()}.png`;
  downloadFile(href, filename);
};

/**
 * Button for switching between MJPEG and regular screenshot capture mode.
 * Only shown in MJPEG mode.
 */
const ScreenshotCaptureModeControls = ({
  setMjpegState,
  isUsingMjpegMode,
  setRefreshingState,
  applyClientMethod,
}) => {
  const {t} = useTranslation();

  const switchScreenCaptureMode = (shouldUseMjpeg) => {
    setMjpegState(shouldUseMjpeg);
    if (!shouldUseMjpeg) {
      setRefreshingState({source: true});
    }
    applyClientMethod({methodName: 'getPageSource'});
  };

  return (
    <Space.Compact>
      <Tooltip title={t('useMjpegStream')} placement="topLeft">
        <Button
          icon={<IconMovie size={18} />}
          onClick={() => switchScreenCaptureMode(true)}
          type={isUsingMjpegMode ? BUTTON.PRIMARY : BUTTON.DEFAULT}
        />
      </Tooltip>
      <Tooltip title={t('useScreenshotApi')} placement="topLeft">
        <Button
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
const ToggleElementHandlesButton = ({
  showCentroids,
  toggleShowCentroids,
  isGestureEditorVisible,
}) => {
  const {t} = useTranslation();

  return (
    <Tooltip title={t(showCentroids ? 'Hide Element Handles' : 'Show Element Handles')}>
      <Button
        icon={<IconEyePlus size={18} />}
        onClick={() => toggleShowCentroids()}
        type={showCentroids ? BUTTON.PRIMARY : BUTTON.DEFAULT}
        disabled={isGestureEditorVisible}
      />
    </Tooltip>
  );
};

/**
 * Button allowing to switch between the Element Mode and Coordinates Mode
 * when interacting with the screenshot.
 */
const ScreenshotInteractionModeControls = ({
  screenshotInteractionMode,
  selectScreenshotInteractionMode,
  clearCoordAction,
  isGestureEditorVisible,
}) => {
  const {t} = useTranslation();

  const screenshotInteractionChange = (mode) => {
    clearCoordAction(); // When the action changes, reset the swipe action
    selectScreenshotInteractionMode(mode);
  };

  return (
    <Space.Compact>
      <Tooltip title={t('Select Elements')}>
        <Button
          icon={<IconObjectScan size={18} />}
          onClick={() => screenshotInteractionChange(SELECT)}
          type={screenshotInteractionMode === SELECT ? BUTTON.PRIMARY : BUTTON.DEFAULT}
          disabled={isGestureEditorVisible}
        />
      </Tooltip>
      <Tooltip title={t('Tap/Swipe By Coordinates')}>
        <Button
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

  return (
    <Tooltip title={t('Download Screenshot')}>
      <Button
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
      <Space size="middle">
        {serverDetails.mjpegScreenshotUrl !== null && (
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
