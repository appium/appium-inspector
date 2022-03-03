import React, { useEffect, useRef, useState } from 'react';
import { SCREENSHOT_INTERACTION_MODE } from '../../../renderer/components/Inspector/shared';
import { Spin } from 'antd';
import styles from './Inspector.css';

const SauceStreamScreen = (props) => {
  const [wsRunning, setWsRunning] = useState(false);
  const [isTouchStarted, setIsTouchStarted] = useState(false);
  const [clientOffsets, setClientOffsets] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const canvasElement = useRef(null);
  const canvasContainer = useRef(null);
  const [scaleRatio, setScaleRatio] = useState(1);
  const [xCo, setXCo] = useState(null);
  const [yCo, setYCo] = useState(null);
  const {
    applyClientMethod,
    // needed for determining sessionId of Sauce
    driver: {
      client: {
        capabilities: {
          testobject_test_report_api_url = '',
          testobject_device_session_id = '',
        },
      },
    },
    windowSize,
  } = props;
  // const sID = /(emulator|simulator)$/i.test(deviceName)
  //   ? sessionId
  //   : // : testobject_test_report_api_url.split('/').pop();
  //     testobject_device_session_id;
  /**
   * For the websockets
   */
  const dc = 'eu-central-1';
  const wsUrl = `wss://api.${dc}.saucelabs.com/v1/rdc/socket/alternativeIo/${testobject_device_session_id}`;
  const ws = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket(wsUrl);
    ws.current.binaryType = 'blob';
    ws.current.onopen = () => {
      console.log('Connected to the server');
      setWsRunning(true);
    };

    ws.current.onclose = (e) => {
      console.log('ws.onclose e = ', e);
      console.log('Disconnected. Check internet or server.');
      setWsRunning(false);
    };
    ws.current.onerror = (e) => {
      console.log('onerror error = ', e);
      setWsRunning(false);
    };

    const wsCurrent = ws.current;

    return () => {
      wsCurrent.close();
    };
  }, []);
  useEffect(() => {
    if (!ws.current) {
      return;
    }

    // Ran when teh app receives a message from the server
    ws.current.onmessage = (e) => {
      // const message = e.data;

      // console.log('message = ', message);

      // if (message instanceof Blob) {
      //   const blob = new Blob([message], {
      //     type: 'image/jpeg',
      //     lastModified: 1,
      //   });
      //   const fileReaderInstance = new FileReader();
      //   fileReaderInstance.readAsDataURL(blob);
      //   fileReaderInstance.onload = () => {
      //     setImageBase64(fileReaderInstance.result);
      //   };
      // }
      handleMessage(e);
    };
  }, []);

  const render = (image) => {
    const canvas = canvasElement.current;
    const context = canvas.getContext('2d');
    const isImageLandspace = image.width > image.height;
    console.log(
      `image.width X image.height = ${windowSize.width}x${windowSize.height}`
    );
    console.log(`image.width X image.height = ${image.width}x${image.height}`);
    const canvasWidth = Math.floor(windowSize.width);
    const canvasHeight = Math.floor(windowSize.height);
    canvas.height = canvasHeight;
    canvas.width = canvasWidth;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    context.clearRect(0, 0, canvasWidth, canvasHeight);

    if (isImageLandspace) {
      context.save();
      context.translate(centerX, centerY);
      context.rotate((90 * Math.PI) / 180);
      context.drawImage(image, -centerY, -centerX, canvasHeight, canvasWidth);
      context.restore();
    } else {
      context.drawImage(image, 0, 0, canvasWidth, canvasHeight);
    }
  };
  const handleMessage = (event) => {
    const message = event.data;

    if (message instanceof Blob) {
      handleImage(message);
    }
  };
  const handleImage = (data) => {
    const blob = new Blob([data], { type: 'image/jpeg' });
    let image = new Image();

    image.onload = function () {
      image.onload = null;
      image.onerror = null;
      render(image);
      // @TODO: check what this one does
      // framebufferStats.update();
      window.URL.revokeObjectURL(image.src);
      image = null;
    };

    image.onerror = function (error) {
      image.onload = null;
      image.onerror = null;
      console.error('Could not load image', error);
    };

    image.src = window.URL.createObjectURL(blob);
    ws.current.send('n/');
  };
  const handleSwipeStart = (e) => {
    console.log('handleSwipeStart start e', e);
    console.log('Math.round(e.clientY ) = ', e.clientY);
    console.log('Math.round(scaleRatio  = ', scaleRatio);
    console.log('Math.round(clientOffsets.y) = ', clientOffsets.y);
    console.log(
      'Math.round(e.clientY * scaleRatio - clientOffsets.y) = ',
      Math.round(e.clientY * scaleRatio - clientOffsets.y)
    );
    console.log(
      'without Math.round(e.clientY * scaleRatio - clientOffsets.y) = ',
      e.clientY * scaleRatio - clientOffsets.y
    );
    setIsTouchStarted(true);
    setTouchStart({
      x: Math.floor(e.clientX * scaleRatio - clientOffsets.x),
      y: Math.floor(e.clientY * scaleRatio - clientOffsets.y),
    });
  };
  const handleSwipeMove = (e) => {
    if (!isTouchStarted) {
      setXCo(Math.round(e.clientX * scaleRatio - clientOffsets.x));
      setYCo(Math.round(e.clientY * scaleRatio - clientOffsets.y));
      return;
    }
    setTouchEnd({
      x: Math.floor(e.clientX * scaleRatio - clientOffsets.x),
      y: Math.floor(e.clientY * scaleRatio - clientOffsets.y),
    });
  };
  const handleSwipeEnd = async () => {
    console.log('handleSwipeEnd the end');
    console.log('handleSwipeEnd touchStart = ', touchStart);
    console.log('handleSwipeEnd touchEnd = ', touchEnd);
    // This is a swipe
    if (touchEnd && JSON.stringify(touchStart) !== JSON.stringify(touchEnd)) {
      await applyClientMethod({
        methodName: SCREENSHOT_INTERACTION_MODE.SWIPE,
        args: [touchStart.x, touchStart.y, touchEnd.x, touchEnd.y],
        skipRefresh: true,
      });
    } else {
      // This is a single click
      await applyClientMethod({
        methodName: SCREENSHOT_INTERACTION_MODE.TAP,
        args: [touchStart.x, touchStart.y],
        skipRefresh: true,
      });
    }
    // Now reset
    setTouchStart(null);
    setTouchEnd(null);
  };
  const onLostCapture = () => {
    setXCo(0);
    setYCo(0);
  };
  const onKeyDown = async (event) => {
    const KEY_CODES = {
      backspace: 'Backspace',
      enter: 'Enter',
    };
    event.preventDefault();
    let key;
    switch (event.key) {
      case KEY_CODES.backspace:
        key = '\b';
        break;
      case KEY_CODES.enter:
        key = '\n';
        break;
      default:
        key = event.key;
        break;
    }
    console.log('event key = ', key);
    await applyClientMethod({
      methodName: SCREENSHOT_INTERACTION_MODE.TYPE,
      args: [key],
      skipRefresh: true,
    });
  };
  const updateScaleRatio = () =>
    setScaleRatio(windowSize.width / canvasElement.current.offsetWidth);

  useEffect(() => {
    updateScaleRatio();
    window.addEventListener('resize', updateScaleRatio);

    return () => window.removeEventListener('resize', updateScaleRatio);
  }, [updateScaleRatio]);
  useEffect(() => {
    document.addEventListener('keydown', onKeyDown);
    // Need to wait a second here, due to the toolbar going down and up when activating
    // the Sauce stream. Without the wait it will determine the incorrect position
    (async () =>
      new Promise((resolve) =>
        setTimeout(() => {
          const { x, y } = canvasContainer.current.getBoundingClientRect();
          setClientOffsets({ x, y });
          return resolve();
        }, 1000)
      ))();
  }, []);

  return (
    <Spin size="large" spinning={!wsRunning}>
      <div className={styles.innerScreenshotContainer}>
        <div
          ref={canvasContainer}
          style={{
            cursor: 'crosshair',
          }}
          className={styles.screenshotBox}
          onPointerDown={handleSwipeStart}
          onPointerMove={handleSwipeMove}
          onPointerUp={handleSwipeEnd}
          onLostPointerCapture={onLostCapture}
        >
          {/* {xCo !== null && (
            <div className={styles.coordinatesContainer}>
              <p>X: {xCo}</p>
              <p>Y: {yCo}</p>
            </div>
          )} */}
          <span
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              textAlign: 'center',
              color: 'grey',
              fontSize: 12,
              width: '100%',
            }}
          >
            You are watching the live video recording
          </span>
          <canvas
            ref={canvasElement}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              border: '1px solid #eee',
              boxShadow: '0px 0px 1px 2px rgb(0 0 0 / 5%)',
            }}
          />
        </div>
      </div>
    </Spin>
  );
};

export default SauceStreamScreen;
