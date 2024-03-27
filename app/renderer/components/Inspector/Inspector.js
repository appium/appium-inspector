import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CodeOutlined,
  CopyOutlined,
  DownloadOutlined,
  FileTextOutlined,
  HighlightOutlined,
  InfoCircleOutlined,
  PlusSquareOutlined,
  SelectOutlined,
  TagOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {Button, Card, Modal, Space, Spin, Switch, Tabs, Tooltip} from 'antd';
import {debounce} from 'lodash';
import React, {useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';

import {BUTTON} from '../../constants/antd-types';
import {WINDOW_DIMENSIONS} from '../../constants/common';
import {
  INSPECTOR_TABS,
  MJPEG_STREAM_CHECK_INTERVAL,
  SESSION_EXPIRY_PROMPT_TIMEOUT,
} from '../../constants/session-inspector';
import {SCREENSHOT_INTERACTION_MODE} from '../../constants/screenshot';
import {clipboard} from '../../polyfills';
import Commands from './Commands';
import GestureEditor from './GestureEditor';
import HeaderButtons from './HeaderButtons';
import InspectorStyles from './Inspector.css';
import Recorder from './Recorder';
import SavedGestures from './SavedGestures';
import Screenshot from './Screenshot';
import SelectedElement from './SelectedElement';
import SessionInfo from './SessionInfo';
import Source from './Source';

const {SELECT, TAP_SWIPE} = SCREENSHOT_INTERACTION_MODE;

const downloadFile = (href, filename) => {
  let element = document.createElement('a');
  element.setAttribute('href', href);
  element.setAttribute('download', filename);
  element.style.display = 'none';

  document.body.appendChild(element);
  element.click();

  document.body.removeChild(element);
};

const downloadXML = (sourceXML) => {
  const href = 'data:application/xml;charset=utf-8,' + encodeURIComponent(sourceXML);
  const filename = `app-source-${new Date().toJSON()}.xml`;
  downloadFile(href, filename);
};

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
    sourceXML,
    visibleCommandResult,
    mjpegScreenshotUrl,
    isAwaitingMjpegStream,
    toggleShowCentroids,
    showCentroids,
    isGestureEditorVisible,
    toggleShowAttributes,
    isSourceRefreshOn,
    windowSize,
    t,
  } = props;

  const didInitialResize = useRef(false);
  const screenAndSourceEl = useRef(null);
  const screenshotEl = useRef(null);
  const mjpegStreamCheckInterval = useRef(null);

  const [scaleRatio, setScaleRatio] = useState(1);

  const navigate = useNavigate();

  const showScreenshot =
    (screenshot && !screenshotError) ||
    (mjpegScreenshotUrl && (!isSourceRefreshOn || !isAwaitingMjpegStream));

  // Calculate the ratio for scaling items overlaid on the screenshot
  // (highlighter rectangles/circles, gestures, etc.)
  const updateScaleRatio = (imgWidth) => setScaleRatio(windowSize.width / imgWidth);

  const updateScaleRatioDebounced = debounce(updateScaleRatio, 500);

  const updateSourceTreeWidth = () => {
    // the idea here is to keep track of the screenshot image width. if it has
    // too much space to the right or bottom, adjust the max-width of the
    // screenshot container so the source tree flex adjusts to always fill the
    // remaining space. This keeps everything looking tight.
    if (!screenAndSourceEl.current) {
      return;
    }

    const screenshotBox = screenAndSourceEl.current.querySelector('#screenshotContainer');
    const img = screenAndSourceEl.current.querySelector('#screenshotContainer img#screenshot');

    if (!img) {
      return;
    }

    const imgRect = img.getBoundingClientRect();
    const screenshotRect = screenshotBox.getBoundingClientRect();
    if (imgRect.height < screenshotRect.height) {
      // get the expected image width if the image would fill the screenshot box height
      const attemptedImgWidth = (screenshotRect.height / imgRect.height) * imgRect.width;
      // get the maximum image width as a fraction of the current window width
      const maxImgWidth = window.innerWidth * WINDOW_DIMENSIONS.MAX_IMAGE_WIDTH_FRACTION;
      const curMaxImgWidth = Math.min(maxImgWidth, attemptedImgWidth);
      screenshotBox.style.maxWidth = `${curMaxImgWidth}px`;
    } else if (imgRect.width < screenshotRect.width) {
      screenshotBox.style.maxWidth = `${imgRect.width}px`;
    }

    updateScaleRatioDebounced(imgRect.width);
  };

  const updateSourceTreeWidthDebounced = debounce(updateSourceTreeWidth, 50);

  const checkMjpegStream = async () => {
    const {setAwaitingMjpegStream} = props;
    const img = new Image();
    img.src = mjpegScreenshotUrl;
    let imgReady = false;
    try {
      await img.decode();
      imgReady = true;
    } catch (ign) {}
    if (imgReady && isAwaitingMjpegStream) {
      setAwaitingMjpegStream(false);
      updateSourceTreeWidthDebounced();
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
    const {applyClientMethod, getSavedActionFramework, runKeepAliveLoop, setSessionTime} = props;
    const curHeight = window.innerHeight;
    const curWidth = window.innerWidth;
    const needsResize =
      curHeight < WINDOW_DIMENSIONS.MIN_HEIGHT || curWidth < WINDOW_DIMENSIONS.MIN_WIDTH;
    if (!didInitialResize.current && needsResize) {
      const newWidth =
        curWidth < WINDOW_DIMENSIONS.MIN_WIDTH ? WINDOW_DIMENSIONS.MIN_WIDTH : curWidth;
      const newHeight =
        curHeight < WINDOW_DIMENSIONS.MIN_HEIGHT ? WINDOW_DIMENSIONS.MIN_HEIGHT : curHeight;
      // resize width to something sensible for using the inspector on first run
      window.resizeTo(newWidth, newHeight);
    }
    didInitialResize.current = true;
    applyClientMethod({methodName: 'getPageSource', ignoreResult: true});
    getSavedActionFramework();
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
      updateSourceTreeWidthDebounced();
      window.addEventListener('resize', updateSourceTreeWidthDebounced);
      if (mjpegScreenshotUrl) {
        mjpegStreamCheckInterval.current = setInterval(
          checkMjpegStream,
          MJPEG_STREAM_CHECK_INTERVAL,
        );
      }
    }
    return () => {
      if (windowSize) {
        window.removeEventListener('resize', updateSourceTreeWidthDebounced);
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
        <Button.Group value={screenshotInteractionMode}>
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
        </Button.Group>
        {showScreenshot && !mjpegScreenshotUrl && (
          <Tooltip title={t('Download Screenshot')}>
            <Button icon={<DownloadOutlined />} onClick={() => downloadScreenshot(screenshot)} />
          </Tooltip>
        )}
      </Space>
    </div>
  );

  const main = (
    <div
      className={InspectorStyles['inspector-main']}
      ref={(el) => (screenAndSourceEl.current = el)}
    >
      <div
        id="screenshotContainer"
        className={InspectorStyles['screenshot-container']}
        ref={(el) => (screenshotEl.current = el)}
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
      <div id="sourceTreeContainer" className={InspectorStyles['interaction-tab-container']}>
        <Tabs
          activeKey={selectedInspectorTab}
          size="small"
          onChange={(tab) => selectInspectorTab(tab)}
          items={[
            {
              label: t('Source'),
              key: INSPECTOR_TABS.SOURCE,
              children: (
                <div className="action-row">
                  <div className="action-col">
                    <Card
                      title={
                        <span>
                          <FileTextOutlined /> {t('App Source')}{' '}
                        </span>
                      }
                      extra={
                        <span>
                          <Tooltip title={t('Toggle Attributes')}>
                            <Button
                              type="text"
                              id="btnToggleAttrs"
                              icon={<CodeOutlined />}
                              onClick={toggleShowAttributes}
                            />
                          </Tooltip>
                          <Tooltip title={t('Copy XML Source to Clipboard')}>
                            <Button
                              type="text"
                              id="btnSourceXML"
                              icon={<CopyOutlined />}
                              onClick={() => clipboard.writeText(sourceXML)}
                            />
                          </Tooltip>
                          <Tooltip title={t('Download Source as .XML File')}>
                            <Button
                              type="text"
                              id="btnDownloadSourceXML"
                              icon={<DownloadOutlined />}
                              onClick={() => downloadXML(sourceXML)}
                            />
                          </Tooltip>
                        </span>
                      }
                    >
                      <Source {...props} />
                    </Card>
                  </div>
                  <div
                    id="selectedElementContainer"
                    className={`${InspectorStyles['interaction-tab-container']} ${InspectorStyles['element-detail-container']} action-col`}
                  >
                    <Card
                      title={
                        <span>
                          <TagOutlined /> {t('selectedElement')}
                        </span>
                      }
                      className={InspectorStyles['selected-element-card']}
                    >
                      {selectedElement.path && <SelectedElement {...props} />}
                      {!selectedElement.path && <i>{t('selectElementInSource')}</i>}
                    </Card>
                  </div>
                </div>
              ),
            },
            {
              label: t('Commands'),
              key: INSPECTOR_TABS.COMMANDS,
              children: (
                <Card
                  title={
                    <span>
                      <ThunderboltOutlined /> {t('Execute Commands')}
                    </span>
                  }
                  className={InspectorStyles['interaction-tab-card']}
                >
                  <Commands {...props} />
                </Card>
              ),
            },
            {
              label: t('Gestures'),
              key: INSPECTOR_TABS.GESTURES,
              children: isGestureEditorVisible ? (
                <Card
                  title={
                    <span>
                      <HighlightOutlined /> {t('Gesture Builder')}
                    </span>
                  }
                  className={InspectorStyles['interaction-tab-card']}
                >
                  <GestureEditor {...props} />
                </Card>
              ) : (
                <Card
                  title={
                    <span>
                      <HighlightOutlined /> {t('Saved Gestures')}
                    </span>
                  }
                  className={InspectorStyles['interaction-tab-card']}
                >
                  <SavedGestures {...props} />
                </Card>
              ),
            },
            {
              label: t('Recorder'),
              key: INSPECTOR_TABS.RECORDER,
              children: <Recorder {...props} />,
            },
            {
              label: t('Session Information'),
              key: INSPECTOR_TABS.SESSION_INFO,
              children: (
                <Card
                  title={
                    <span>
                      <InfoCircleOutlined /> {t('Session Information')}
                    </span>
                  }
                  className={InspectorStyles['interaction-tab-card']}
                >
                  <SessionInfo {...props} />
                </Card>
              ),
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
