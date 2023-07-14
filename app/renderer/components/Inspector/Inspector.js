import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';
import { SCREENSHOT_INTERACTION_MODE, INTERACTION_MODE } from './shared';
import { Card, Button, Spin, Tooltip, Modal, Tabs, Space, Switch } from 'antd';
import Screenshot from './Screenshot';
import HeaderButtons from './HeaderButtons';
import SelectedElement from './SelectedElement';
import Source from './Source';
import InspectorStyles from './Inspector.css';
import RecordedActions from './RecordedActions';
import Commands from './Commands';
import SavedGestures from './SavedGestures';
import GestureEditor from './GestureEditor';
import SessionInfo from './SessionInfo';
import { clipboard } from '../../polyfills';
import { SelectOutlined, ScanOutlined, SwapRightOutlined, CheckCircleOutlined,
         CloseCircleOutlined, CopyOutlined, DownloadOutlined, FileTextOutlined,
         TagOutlined, InfoCircleOutlined, ThunderboltOutlined, HighlightOutlined,
         CodeOutlined } from '@ant-design/icons';
import { BUTTON } from '../AntdTypes';

const { SELECT, SWIPE, TAP } = SCREENSHOT_INTERACTION_MODE;

const MIN_WIDTH = 870;
const MIN_HEIGHT = 610;
const MAX_SCREENSHOT_WIDTH = 500;

const MJPEG_STREAM_CHECK_INTERVAL = 1000;
const SESSION_EXPIRY_PROMPT_TIMEOUT = 60 * 60 * 1000; // Give user 1 hour to reply

const downloadXML = (sourceXML) => {
  let element = document.createElement('a');
  element.setAttribute('href', 'data:application/xml;charset=utf-8,' + encodeURIComponent(sourceXML));
  element.setAttribute('download', 'source.xml');
  element.style.display = 'none';

  document.body.appendChild(element);
  element.click();

  document.body.removeChild(element);
};

const Inspector = (props) => {
  const { screenshot, screenshotError, selectedElement = {}, quitSession, showRecord,
          screenshotInteractionMode, visibleCommandMethod, selectedInteractionMode,
          selectInteractionMode, setVisibleCommandResult, setUserWaitTimeout,
          showKeepAlivePrompt, keepSessionAlive, sourceXML, visibleCommandResult,
          mjpegScreenshotUrl, isAwaitingMjpegStream, toggleShowCentroids, showCentroids,
          isGestureEditorVisible, toggleShowAttributes, isSourceRefreshOn, windowSize, t } = props;

  const didInitialResize = useRef(false);
  const screenAndSourceEl = useRef(null);
  const screenshotEl = useRef(null);
  const mjpegStreamCheckInterval = useRef(null);

  const [scaleRatio, setScaleRatio] = useState(1);

  const navigate = useNavigate();

  const showScreenshot = ((screenshot && !screenshotError) ||
                          (mjpegScreenshotUrl && (!isSourceRefreshOn || !isAwaitingMjpegStream)));

  // Calculate the ratio for scaling items overlaid on the screenshot
  // (highlighter rectangles/circles, gestures, etc.)
  const updateScaleRatio = () => {
    const screenshotImg = screenshotEl.current.querySelector('img');
    setScaleRatio(windowSize.width / screenshotImg.offsetWidth);
  };

  const updateScaleRatioDebounced = debounce(updateScaleRatio, 500);

  const updateSourceTreeWidth = () => {
    // the idea here is to keep track of the screenshot image width. if it has
    // too much space to the right or bottom, adjust the max-width of the
    // screenshot container so the source tree flex adjusts to always fill the
    // remaining space. This keeps everything looking tight.
    if (!screenAndSourceEl.current) { return; }

    const screenshotBox = screenAndSourceEl.current.querySelector('#screenshotContainer');
    const img = screenAndSourceEl.current.querySelector('#screenshotContainer img#screenshot');

    if (!img) { return; }

    const imgRect = img.getBoundingClientRect();
    const screenshotRect = screenshotBox.getBoundingClientRect();
    screenshotBox.style.flexBasis = `${imgRect.width}px`;
    if (imgRect.height < screenshotRect.height) {
      // get what the img width would be if it fills screenshot box height
      const attemptedWidth = (screenshotRect.height / imgRect.height) * imgRect.width;
      screenshotBox.style.maxWidth = attemptedWidth > MAX_SCREENSHOT_WIDTH ?
        `${MAX_SCREENSHOT_WIDTH}px` :
        `${attemptedWidth}px`;
    } else if (imgRect.width < screenshotRect.width) {
      screenshotBox.style.maxWidth = `${imgRect.width}px`;
    }

    updateScaleRatioDebounced();
  };

  const updateSourceTreeWidthDebounced = debounce(updateSourceTreeWidth, 50);

  const checkMjpegStream = async () => {
    const { setAwaitingMjpegStream } = props;
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
    const { selectScreenshotInteractionMode, clearSwipeAction } = props;
    clearSwipeAction(); // When the action changes, reset the swipe action
    selectScreenshotInteractionMode(mode);
  };

  const quitCurrentSession = async (reason, killedByUser = true) => {
    await quitSession(reason, killedByUser);
    navigate('/session', { replace: true });
  };

  useEffect(() => {
    const { applyClientMethod, getSavedActionFramework, runKeepAliveLoop, setSessionTime } = props;
    const curHeight = window.innerHeight;
    const curWidth = window.innerWidth;
    const needsResize = (curHeight < MIN_HEIGHT) || (curWidth < MIN_WIDTH);
    if (!didInitialResize.current && needsResize) {
      const newWidth = curWidth < MIN_WIDTH ? MIN_WIDTH : curWidth;
      const newHeight = curHeight < MIN_HEIGHT ? MIN_HEIGHT : curHeight;
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
        mjpegStreamCheckInterval.current = setInterval(checkMjpegStream, MJPEG_STREAM_CHECK_INTERVAL);
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

  const screenShotControls = <div className={InspectorStyles['screenshot-controls']}>
    <Space size='middle'>
      <Tooltip title={t(showCentroids ? 'Hide Element Handles' : 'Show Element Handles')} placement='topRight'>
        <Switch
          checkedChildren={<CheckCircleOutlined />}
          unCheckedChildren={<CloseCircleOutlined />}
          defaultChecked={false}
          onChange={() => toggleShowCentroids()}
          disabled={isGestureEditorVisible} />
      </Tooltip>
      <Button.Group value={screenshotInteractionMode}>
        <Tooltip title={t('Select Elements')}>
          <Button icon={<SelectOutlined/>} onClick={() => screenshotInteractionChange(SELECT)}
            type={screenshotInteractionMode === SELECT ? BUTTON.PRIMARY : BUTTON.DEFAULT}
            disabled={isGestureEditorVisible} />
        </Tooltip>
        <Tooltip title={t('Swipe By Coordinates')}>
          <Button icon={<SwapRightOutlined/>} onClick={() => screenshotInteractionChange(SWIPE)}
            type={screenshotInteractionMode === SWIPE ? BUTTON.PRIMARY : BUTTON.DEFAULT}
            disabled={isGestureEditorVisible} />
        </Tooltip>
        <Tooltip title={t('Tap By Coordinates')}>
          <Button icon={<ScanOutlined/>} onClick={() => screenshotInteractionChange(TAP)}
            type={screenshotInteractionMode === TAP ? BUTTON.PRIMARY : BUTTON.DEFAULT}
            disabled={isGestureEditorVisible} />
        </Tooltip>
      </Button.Group>
    </Space>
  </div>;

  const main = <div className={InspectorStyles['inspector-main']} ref={(el) => screenAndSourceEl.current = el}>
    <div id='screenshotContainer' className={InspectorStyles['screenshot-container']} ref={(el) => screenshotEl.current = el}>
      {screenShotControls}
      {showScreenshot && <Screenshot {...props} scaleRatio={scaleRatio} />}
      {screenshotError && t('couldNotObtainScreenshot', {screenshotError})}
      {!showScreenshot && <Spin size="large" spinning={true}>
        <div className={InspectorStyles.screenshotBox} />
      </Spin>}
    </div>
    <div id='sourceTreeContainer' className={InspectorStyles['interaction-tab-container']} >
      {showRecord && <RecordedActions {...props} />}
      <Tabs activeKey={selectedInteractionMode}
        size="small"
        onChange={(tab) => selectInteractionMode(tab)}
        items={[{
          label: t('Source'), key: INTERACTION_MODE.SOURCE, children:
            <div className='action-row'>
              <div className='action-col'>
                <Card title={<span><FileTextOutlined /> {t('App Source')} </span>}
                  extra={
                    <span>
                      <Tooltip title={t('Toggle Attributes')}>
                        <Button type='text' id='btnToggleAttrs' icon={<CodeOutlined/>} onClick={toggleShowAttributes} />
                      </Tooltip>
                      <Tooltip title={t('Copy XML Source to Clipboard')}>
                        <Button type='text' id='btnSourceXML' icon={<CopyOutlined/>} onClick={() => clipboard.writeText(sourceXML)} />
                      </Tooltip>
                      <Tooltip title={t('Download Source as .XML File')}>
                        <Button type='text' id='btnDownloadSourceXML' icon={<DownloadOutlined/>} onClick={() => downloadXML(sourceXML)}/>
                      </Tooltip>
                    </span>
                  }>
                  <Source {...props} />
                </Card>
              </div>
              <div id='selectedElementContainer'
                className={`${InspectorStyles['interaction-tab-container']} ${InspectorStyles['element-detail-container']} action-col`}>
                <Card title={<span><TagOutlined /> {t('selectedElement')}</span>}
                  className={InspectorStyles['selected-element-card']}>
                  {selectedElement.path && <SelectedElement {...props}/>}
                  {!selectedElement.path && <i>{t('selectElementInSource')}</i>}
                </Card>
              </div>
            </div>
        }, {
          label: t('Commands'), key: INTERACTION_MODE.COMMANDS, children:
            <Card
              title={<span><ThunderboltOutlined /> {t('Execute Commands')}</span>}
              className={InspectorStyles['interaction-tab-card']}>
              <Commands {...props} />
            </Card>
        }, {
          label: t('Gestures'), key: INTERACTION_MODE.GESTURES, children:
            isGestureEditorVisible ?
              <Card
                title={<span><HighlightOutlined /> {t('Gesture Builder')}</span>}
                className={InspectorStyles['interaction-tab-card']}>
                <GestureEditor {...props}/>
              </Card>
              :
              <Card
                title={<span><HighlightOutlined /> {t('Saved Gestures')}</span>}
                className={InspectorStyles['interaction-tab-card']}>
                <SavedGestures {...props} />
              </Card>
        }, {
          label: t('Session Information'), key: INTERACTION_MODE.SESSION_INFO, children:
            <Card
              title={<span><InfoCircleOutlined /> {t('Session Information')}</span>}
              className={InspectorStyles['interaction-tab-card']}>
              <SessionInfo {...props} />
            </Card>
        }]}
      />
    </div>
  </div>;

  return (
    <div className={InspectorStyles['inspector-container']}>
      <HeaderButtons quitCurrentSession={quitCurrentSession} {...props}/>
      {main}
      <Modal
        title={t('Session Inactive')}
        open={showKeepAlivePrompt}
        onOk={() => keepSessionAlive()}
        onCancel={() => quitCurrentSession()}
        okText={t('Keep Session Running')}
        cancelText={t('Quit Session')}>
        <p>{t('Your session is about to expire')}</p>
      </Modal>
      <Modal
        title={t('methodCallResult', {methodName: visibleCommandMethod})}
        open={!!visibleCommandResult}
        onOk={() => setVisibleCommandResult(null)}
        onCancel={() => setVisibleCommandResult(null)}>
        <pre><code>{visibleCommandResult}</code></pre>
      </Modal>
    </div>
  );
};

export default Inspector;
