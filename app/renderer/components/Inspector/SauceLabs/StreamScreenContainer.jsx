import React, { useRef, useState } from 'react';
import { Spin } from 'antd';
import { SCREENSHOT_INTERACTION_MODE } from '../shared';
import webSocketHandler from './WebSocketHandler';
import StreamScreen from './StreamScreen';
import Explanation from './Explanation';
import styles from './StreamScreenContainer.css';
import Menu from './Menu';

const StreamScreenContainer = ({
  applyAppiumMethod,
  deviceScreenSize,
  driverData: {
    client: {
      capabilities: { platformName, testobject_device_session_id = '' },
    },
  },
  serverData: { accessKey, dataCenter, username },
}) => {
  //=======
  // States
  //=======
  const [canvasLoaded, setCanvasLoaded] = useState(false);
  const [clientOffsets, setClientOffsets] = useState(null);
  const [isMouseUsed, setIsMouseUsed] = useState(false);
  const [isTouchStarted, setIsTouchStarted] = useState(false);
  const [scaleRatio, setScaleRatio] = useState(1);
  const [touchEnd, setTouchEnd] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [wsRunning, setWsRunning] = useState(false);
  const [xCo, setXCo] = useState(null);
  const [yCo, setYCo] = useState(null);

  //=====
  // Refs
  //=====
  const canvasElement = useRef(null);
  const canvasContainer = useRef(null);

  //========
  // Methods
  //========
  /**
   * Handle the swipe start
   * @param {*} e
   */
  const handleSwipeStart = (e) => {
    setIsTouchStarted(true);

    setTouchStart({
      x: Math.floor((e.clientX - clientOffsets.left) / scaleRatio),
      y: Math.floor((e.clientY - clientOffsets.top) / scaleRatio),
    });
  };
  /**
   * Handle the Swipe move
   * @param {*} e
   */
  const handleSwipeMove = (e) => {
    setXCo(e.clientX - clientOffsets.left);
    setYCo(e.clientY - clientOffsets.top);

    if (!isTouchStarted) {
      return;
    }
    setTouchEnd({
      x: Math.floor((e.clientX - clientOffsets.left) / scaleRatio),
      y: Math.floor((e.clientY - clientOffsets.top) / scaleRatio),
    });
  };
  /**
   * Handle the swipe end
   */
  const handleSwipeEnd = async () => {
    // This is a swipe
    if (touchEnd && JSON.stringify(touchStart) !== JSON.stringify(touchEnd)) {
      await applyAppiumMethod({
        methodName: SCREENSHOT_INTERACTION_MODE.SWIPE,
        args: [touchStart.x, touchStart.y, touchEnd.x, touchEnd.y],
        skipRefresh: true,
      });
    } else {
      // This is a single click
      await applyAppiumMethod({
        methodName: SCREENSHOT_INTERACTION_MODE.TAP,
        args: [touchStart.x, touchStart.y],
        skipRefresh: true,
      });
    }
    // Now reset
    setTouchStart(null);
    setTouchEnd(null);
  };
  /**
   * When to show the touch dot
   */
  const onPointerEnter = () => setIsMouseUsed(true);
  /**
   * Reset data when mouse is out of the canvas
   */
  const onPointerLeave = () => setIsMouseUsed(false);
  /**
   * Get the ratio
   * @returns {number}
   */

  //========
  // Effects
  //========
  /**
   * Start and handle the websocket connection and create the video stream
   */
  webSocketHandler({
    canvasContainer,
    canvasElement,
    canvasLoaded,
    connectionData: {
      accessKey,
      dataCenter,
      sessionId: testobject_device_session_id,
      username,
    },
    clientOffsets,
    deviceScreenSize,
    setCanvasLoaded,
    setClientOffsets,
    setScaleRatio,
    setWsRunning,
  });

  return (
    <>
      {wsRunning ? (
        <div className={styles.streamScreenContainer}>
          <StreamScreen
            applyAppiumMethod={applyAppiumMethod}
            canvasContainerRef={canvasContainer}
            canvasElementRef={canvasElement}
            canvasLoaded={canvasLoaded}
            handleSwipeEnd={handleSwipeEnd}
            handleSwipeMove={handleSwipeMove}
            handleSwipeStart={handleSwipeStart}
            isMouseUsed={isMouseUsed}
            mouseCoordinates={{ xCo, yCo }}
            onPointerEnter={onPointerEnter}
            onPointerLeave={onPointerLeave}
          />
          <Menu
            applyAppiumMethod={applyAppiumMethod}
            platformName={platformName}
          />
          <Explanation />
        </div>
      ) : (
        <div className={styles.sauceSpinner}>
          <Spin size="large" />
        </div>
      )}
    </>
  );
};

export default StreamScreenContainer;
