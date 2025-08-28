import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  PlusSquareOutlined,
  SelectOutlined,
} from '@ant-design/icons';
import {Button, Modal, Space, Spin, Splitter, Switch, Tabs, Tooltip} from 'antd';
import _ from 'lodash';
import {useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router';

import {BUTTON} from '../../constants/antd-types';
import {WINDOW_DIMENSIONS} from '../../constants/common';
import {SCREENSHOT_INTERACTION_MODE} from '../../constants/screenshot';
import {
  INSPECTOR_TABS,
  MJPEG_STREAM_CHECK_INTERVAL,
  SESSION_EXPIRY_PROMPT_TIMEOUT,
} from '../../constants/session-inspector';
import {downloadFile} from '../../utils/file-handling';
import Commands from './Commands.jsx';
import GestureEditor from './GestureEditor.jsx';
import HeaderButtons from './HeaderButtons.jsx';
import InspectorStyles from './Inspector.module.css';
import Recorder from './Recorder.jsx';
import SavedGestures from './SavedGestures.jsx';
import Screenshot from './Screenshot.jsx';
import SelectAnElement from './SelectAnElement.jsx';
import SelectedElement from './SelectedElement.jsx';
import SessionInfo from './SessionInfo.jsx';
import Source from './Source.jsx';

const {SELECT, TAP_SWIPE} = SCREENSHOT_INTERACTION_MODE;

const downloadScreenshot = (screenshot) => {
  const href = `data:image/png;base64,${screenshot}`;
  const filename = `appium-inspector-${new Date().toJSON()}.png`;
  downloadFile(href, filename);
};

const Inspector = (props) => {
  const {
    screenshot,
    screenshotError,
    selectedElement = {},
    quitSession,
    screenshotInteractionMode,
    visibleCommandMethod,
    selectedInspectorTab,
    selectInspectorTab,
    setVisibleCommandResult,
    setUserWaitTimeout,
    showKeepAlivePrompt,
    keepSessionAlive,
    visibleCommandResult,
    serverDetails,
    isUsingMjpegMode,
    isAwaitingMjpegStream,
    toggleShowCentroids,
    showCentroids,
    isGestureEditorVisible,
    isSourceRefreshOn,
    windowSize,
    t,
  } = props;

  const screenshotContainerEl = useRef(null);
  const mjpegStreamCheckInterval = useRef(null);

  const [scaleRatio, setScaleRatio] = useState(1);

  const navigate = useNavigate();

  const showScreenshot =
    (screenshot && !screenshotError) ||
    (isUsingMjpegMode && (!isSourceRefreshOn || !isAwaitingMjpegStream));

  const updateScreenshotScale = () => {
    // If the screenshot has too much space to the right or bottom, adjust the max width
    // of its container, so the source tree always fills the remaining space.
    // This keeps everything looking tight.
    const screenshotContainer = screenshotContainerEl.current;
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

  const updateScreenshotScaleDebounced = _.debounce(updateScreenshotScale, 50);

  const checkMjpegStream = async () => {
    const {setAwaitingMjpegStream} = props;
    const img = new Image();
    img.src = serverDetails.mjpegScreenshotUrl;
    let imgReady = false;
    try {
      await img.decode();
      imgReady = true;
    } catch {}
    if (imgReady && isAwaitingMjpegStream) {
      setAwaitingMjpegStream(false);
      updateScreenshotScaleDebounced();
      // stream obtained - can clear the refresh interval
      clearInterval(mjpegStreamCheckInterval.current);
      mjpegStreamCheckInterval.current = null;
    } else if (!imgReady && !isAwaitingMjpegStream) {
      setAwaitingMjpegStream(true);
    }
  };

  const screenshotInteractionChange = (mode) => {
    const {selectScreenshotInteractionMode, clearCoordAction} = props;
    clearCoordAction(); // When the action changes, reset the swipe action
    selectScreenshotInteractionMode(mode);
  };

  const quitCurrentSession = async (reason, killedByUser = true) => {
    await quitSession(reason, killedByUser);
    navigate('/session', {replace: true});
  };

  useEffect(() => {
    const {
      applyClientMethod,
      getSavedClientFramework,
      runKeepAliveLoop,
      setSessionTime,
      storeSessionSettings,
    } = props;
    const curHeight = window.innerHeight;
    const curWidth = window.innerWidth;
    if (curHeight < WINDOW_DIMENSIONS.MIN_HEIGHT || curWidth < WINDOW_DIMENSIONS.MIN_WIDTH) {
      const newWidth =
        curWidth < WINDOW_DIMENSIONS.MIN_WIDTH ? WINDOW_DIMENSIONS.MIN_WIDTH : curWidth;
      const newHeight =
        curHeight < WINDOW_DIMENSIONS.MIN_HEIGHT ? WINDOW_DIMENSIONS.MIN_HEIGHT : curHeight;
      // resize width to something sensible for using the inspector on first run
      window.resizeTo(newWidth, newHeight);
    }
    applyClientMethod({methodName: 'getPageSource', ignoreResult: true});
    storeSessionSettings();
    getSavedClientFramework();
    runKeepAliveLoop();
    setSessionTime(Date.now());
  }, []);

  /**
   * Ensures component dimensions are adjusted only once windowSize exists.
   * Cannot be combined with the other useEffect hook, since inside it,
   * windowSize is set to 'undefined', and the event listener and MJPEG checker
   * would not update this value when invoked
   */
  useEffect(() => {
    if (windowSize) {
      updateScreenshotScaleDebounced();
      window.addEventListener('resize', updateScreenshotScaleDebounced);
      if (isUsingMjpegMode) {
        mjpegStreamCheckInterval.current = setInterval(
          checkMjpegStream,
          MJPEG_STREAM_CHECK_INTERVAL,
        );
      }
    }
    return () => {
      if (windowSize) {
        window.removeEventListener('resize', updateScreenshotScaleDebounced);
        if (mjpegStreamCheckInterval.current) {
          clearInterval(mjpegStreamCheckInterval.current);
          mjpegStreamCheckInterval.current = null;
        }
      }
    };
  }, [JSON.stringify(windowSize)]);

  // If session expiry prompt is shown, start timeout until session is automatically quit
  // Timeout is canceled if user selects either action in prompt (keep session alive or quit)
  useEffect(() => {
    if (showKeepAlivePrompt) {
      const userWaitTimeout = setTimeout(() => {
        quitCurrentSession(t('Session closed due to inactivity'), false);
      }, SESSION_EXPIRY_PROMPT_TIMEOUT);
      setUserWaitTimeout(userWaitTimeout);
    }
  }, [showKeepAlivePrompt]);

  const screenShotControls = (
    <div className={InspectorStyles['screenshot-controls']}>
      <Space size="middle">
        <Tooltip
          title={t(showCentroids ? 'Hide Element Handles' : 'Show Element Handles')}
          placement="topRight"
        >
          <Switch
            checkedChildren={<CheckCircleOutlined />}
            unCheckedChildren={<CloseCircleOutlined />}
            defaultChecked={false}
            onChange={() => toggleShowCentroids()}
            disabled={isGestureEditorVisible}
          />
        </Tooltip>
        <Space.Compact>
          <Tooltip title={t('Select Elements')}>
            <Button
              icon={<SelectOutlined />}
              onClick={() => screenshotInteractionChange(SELECT)}
              type={screenshotInteractionMode === SELECT ? BUTTON.PRIMARY : BUTTON.DEFAULT}
              disabled={isGestureEditorVisible}
            />
          </Tooltip>
          <Tooltip title={t('Tap/Swipe By Coordinates')}>
            <Button
              icon={<PlusSquareOutlined />}
              onClick={() => screenshotInteractionChange(TAP_SWIPE)}
              type={screenshotInteractionMode === TAP_SWIPE ? BUTTON.PRIMARY : BUTTON.DEFAULT}
              disabled={isGestureEditorVisible}
            />
          </Tooltip>
        </Space.Compact>
        {showScreenshot && !isUsingMjpegMode && (
          <Tooltip title={t('Download Screenshot')}>
            <Button icon={<DownloadOutlined />} onClick={() => downloadScreenshot(screenshot)} />
          </Tooltip>
        )}
      </Space>
    </div>
  );

  const main = (
    <div className={InspectorStyles['inspector-main']}>
      <div
        id="screenshotContainer"
        className={InspectorStyles['screenshot-container']}
        ref={screenshotContainerEl}
      >
        {screenShotControls}
        {showScreenshot && <Screenshot {...props} scaleRatio={scaleRatio} />}
        {screenshotError && t('couldNotObtainScreenshot', {screenshotError})}
        {!showScreenshot && (
          <Spin size="large" spinning={true}>
            <div className={InspectorStyles.screenshotBox} />
          </Spin>
        )}
      </div>
      <div className={InspectorStyles['inspector-tabs-container']}>
        <Tabs
          activeKey={selectedInspectorTab}
          size="small"
          onChange={(tab) => selectInspectorTab(tab)}
          items={[
            {
              label: t('Source'),
              key: INSPECTOR_TABS.SOURCE,
              disabled: !showScreenshot,
              children: (
                <Splitter>
                  <Splitter.Panel collapsible defaultSize="50%" min="25%" max="80%">
                    <Source {...props} />
                  </Splitter.Panel>
                  <Splitter.Panel collapsible>
                    {selectedElement.path && <SelectedElement {...props} />}
                    {!selectedElement.path && <SelectAnElement {...props} />}
                  </Splitter.Panel>
                </Splitter>
              ),
            },
            {
              label: t('Commands'),
              key: INSPECTOR_TABS.COMMANDS,
              disabled: !showScreenshot,
              children: <Commands {...props} />,
            },
            {
              label: t('Gestures'),
              key: INSPECTOR_TABS.GESTURES,
              disabled: !showScreenshot,
              children: isGestureEditorVisible ? (
                <GestureEditor {...props} />
              ) : (
                <SavedGestures {...props} />
              ),
            },
            {
              label: t('Recorder'),
              key: INSPECTOR_TABS.RECORDER,
              disabled: !showScreenshot,
              children: <Recorder {...props} />,
            },
            {
              label: t('Session Information'),
              key: INSPECTOR_TABS.SESSION_INFO,
              disabled: !showScreenshot,
              children: <SessionInfo {...props} />,
            },
          ]}
        />
      </div>
    </div>
  );

  return (
    <div className={InspectorStyles['inspector-container']}>
      <HeaderButtons quitCurrentSession={quitCurrentSession} {...props} />
      {main}
      <Modal
        title={t('Session Inactive')}
        open={showKeepAlivePrompt}
        onOk={() => keepSessionAlive()}
        onCancel={() => quitCurrentSession()}
        okText={t('Keep Session Running')}
        cancelText={t('Quit Session')}
      >
        <p>{t('Your session is about to expire')}</p>
      </Modal>
      <Modal
        title={t('methodCallResult', {methodName: visibleCommandMethod})}
        open={!!visibleCommandResult}
        onOk={() => setVisibleCommandResult(null)}
        onCancel={() => setVisibleCommandResult(null)}
      >
        <pre>
          <code>{visibleCommandResult}</code>
        </pre>
      </Modal>
    </div>
  );
};

export default Inspector;
