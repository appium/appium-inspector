import React, { useCallback, useEffect } from 'react';
import { ipcRenderer } from 'electron';
import { SAUCE_IPC_TYPES } from '../../../../main/sauce';

/**
 * Handle the websocket connection with Sauce Labs
 *
 * @param {object} param0
 * @param {object} param0.canvasContainer
 * @param {object} param0.canvasElement
 * @param {boolean} param0.canvasLoaded
 * @param {object} param0.clientOffsets
 * @param {number} param0.clientOffsets.left
 * @param {number} param0.clientOffsets.top
 * @param {object} param0.connectionData
 * @param {string} param0.connectionData.accessKey
 * @param {string} param0.connectionData.dataCenter
 * @param {string} param0.connectionData.sessionId
 * @param {string} param0.connectionData.username
 * @param {object} param0.deviceScreenSize
 * @param {number} param0.deviceScreenSize.height
 * @param {number} param0.deviceScreenSize.width
 * @param {function} param0.setCanvasLoaded
 * @param {function} param0.setClientOffsets
 * @param {function} param0.setScaleRatio
 * @param {boolean} param0.setWsRunning
 */
const webSocketHandler = ({
  canvasContainer,
  canvasElement,
  connectionData: { accessKey, dataCenter, sessionId, username },
  canvasLoaded,
  clientOffsets,
  deviceScreenSize,
  setCanvasLoaded,
  setClientOffsets,
  setScaleRatio,
  setWsRunning,
}) => {
  const getCanvasData = () => {
    // For some reason the deviceScreenSize is not always set
    if (canvasContainer.current && deviceScreenSize) {
      const { innerHeight, innerWidth } = window;
      const { top, left } = canvasContainer.current.getBoundingClientRect();
      // the 12 is for a bottom space, see Inspector.css
      const canvasHeight = innerHeight - top - 12;
      // 120 is for the menu and 440 for the explanation container,
      // see Explanation.css and Menu.css
      const canvasWidth = innerWidth - left - 120 - 440;
      const isLandscape = deviceScreenSize.width > deviceScreenSize.height;
      let ratio = 0.8;
      if (isLandscape) {
        ratio =
          canvasWidth >= deviceScreenSize.width
            ? 1
            : canvasWidth / deviceScreenSize.width;
      } else {
        ratio =
          canvasHeight >= deviceScreenSize.height
            ? 1
            : canvasHeight / deviceScreenSize.height;
      }
      return { top, left, ratio };
    }

    return { top: 0, left: 0, ratio };
  };
  /**
   * Render the canvas
   * @param {*} image
   */
  const renderCanvas = (image) => {
    const { left, ratio, top } = getCanvasData();
    setScaleRatio(ratio);
    if (!clientOffsets) {
      setClientOffsets({ left, top });
    }
    const canvas = canvasElement.current;
    const context = canvas.getContext('2d');
    const canvasWidth = deviceScreenSize.width * ratio;
    const canvasHeight = deviceScreenSize.height * ratio;
    canvas.height = canvasHeight;
    canvas.width = canvasWidth;
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    context.drawImage(image, 0, 0, canvasWidth, canvasHeight);
  };
  /**
   * Create the image
   * @param {*} blob
   */
  const renderImage = (blob) => {
    let image = new Image();

    image.onload = function () {
      image.onload = null;
      image.onerror = null;
      renderCanvas(image);
      window.URL.revokeObjectURL(image.src);
      image = null;
    };

    image.onerror = function (error) {
      image.onload = null;
      image.onerror = null;
      console.error('Could not load image', error);
    };

    image.src = window.URL.createObjectURL(blob);
  };
  /**
   * Handle the WS message
   * @param {*} event
   */
  const handleMessage = (message) => {
    try {
      const blob = new Blob([new Uint8Array(message).buffer], {
        type: 'image/jpeg',
      });
      if (blob instanceof Blob) {
        renderImage(blob);
      }
    } catch (e) {
      // do nothing
      console.log('handleMessage gave an error, see  = ', e);
    }
  };
  const runWebSocket = useCallback(() => {
    setWsRunning(false);
    ipcRenderer.send(SAUCE_IPC_TYPES.RUN_WS, {
      accessKey,
      dataCenter,
      sessionId,
      username,
    });
  }, []);
  const parseWebsocketData = useCallback(() => {
    ipcRenderer.on(SAUCE_IPC_TYPES.WS_STARTED, () => {
      console.log(`${SAUCE_IPC_TYPES.WS_STARTED} = started`);
      setWsRunning(true);
    });
    ipcRenderer.on(SAUCE_IPC_TYPES.WS_CLOSED, () => {
      console.log(`${SAUCE_IPC_TYPES.WS_CLOSED} = closed`);
    });
    ipcRenderer.on(SAUCE_IPC_TYPES.WS_ERROR, (event, wsResponse) => {
      console.log(`${SAUCE_IPC_TYPES.WS_ERROR} = `, wsResponse);
    });
    ipcRenderer.on(SAUCE_IPC_TYPES.WS_MESSAGE, (event, wsResponse) => {
      handleMessage(wsResponse);
      if (!canvasLoaded) {
        setCanvasLoaded(true);
      }
    });
  }, []);
  const closeWebsocket = useCallback(() => {
    console.log('close websocket');
    ipcRenderer.send(SAUCE_IPC_TYPES.CLOSE_WS);
  }, []);

  useEffect(() => {
    runWebSocket();
    parseWebsocketData();
    return () => closeWebsocket();
  }, [runWebSocket, parseWebsocketData, closeWebsocket]);
};

export default webSocketHandler;
