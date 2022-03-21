import React, { useCallback, useEffect } from 'react';
import { ipcRenderer } from 'electron';
import { SAUCE_IPC_TYPES } from '../../../../main/sauce';

/**
 * Handle the websocket connection with Sauce Labs
 *
 * @param {object} websocketHandlerData
 * @param {object} websocketHandlerData.canvasContainer
 * @param {object} websocketHandlerData.canvasElement
 * @param {boolean} websocketHandlerData.canvasLoaded
 * @param {object} websocketHandlerData.clientOffsets
 * @param {number} websocketHandlerData.clientOffsets.left
 * @param {number} websocketHandlerData.clientOffsets.top
 * @param {object} websocketHandlerData.connectionData
 * @param {string} websocketHandlerData.connectionData.accessKey
 * @param {string} websocketHandlerData.connectionData.dataCenter
 * @param {string} websocketHandlerData.connectionData.sessionId
 * @param {string} websocketHandlerData.connectionData.username
 * @param {object} websocketHandlerData.deviceScreenSize
 * @param {number} websocketHandlerData.deviceScreenSize.height
 * @param {number} websocketHandlerData.deviceScreenSize.width
 * @param {function} websocketHandlerData.setCanvasLoaded
 * @param {function} websocketHandlerData.setClientOffsets
 * @param {function} websocketHandlerData.setScaleRatio
 * @param {boolean} websocketHandlerData.setWsRunning
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
  //========
  // Methods
  //========
  /**
   * Get the current canvas container data
   *
   * @returns {{
   *    top: {number},
   *    left: {number},
   *    ratio: {number}
   * }}
   */
  const getCanvasData = () => {
    let ratio = 0.8;
    if (canvasContainer.current && deviceScreenSize) {
      const { innerHeight, innerWidth } = window;
      const { top, left } = canvasContainer.current.getBoundingClientRect();
      // the 12 is for a bottom space, see Inspector.css
      const canvasHeight = innerHeight - top - 12;
      // 120 is for the menu and 440 for the explanation container,
      // see Explanation.css and Menu.css
      const canvasWidth = innerWidth - left - 120 - 440;
      const isLandscape = deviceScreenSize.width > deviceScreenSize.height;
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
    const canvas = canvasElement.current;
    if (canvas) {
      const { left, ratio, top } = getCanvasData();
      setScaleRatio(ratio);
      if (!clientOffsets) {
        setClientOffsets({ left, top });
      }
      const context = canvas.getContext('2d');
      const canvasWidth = deviceScreenSize.width * ratio;
      const canvasHeight = deviceScreenSize.height * ratio;
      canvas.height = canvasHeight;
      canvas.width = canvasWidth;
      context.clearRect(0, 0, canvasWidth, canvasHeight);
      context.drawImage(image, 0, 0, canvasWidth, canvasHeight);
    }
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
    image.onerror = function () {
      image.onload = null;
      image.onerror = null;
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
      // eslint-disable-next-line no-console
      console.log('handleMessage gave an error, see  = ', e);
    }
  };
  /**
   * Start the websocket connection in the main thread
   */
  const runWebSocket = useCallback(() => {
    // eslint-disable-next-line no-console
    console.log('Client websocket request = start');
    ipcRenderer.send(SAUCE_IPC_TYPES.RUN_WS, {
      accessKey,
      dataCenter,
      sessionId,
      username,
    });
  }, []);
  /**
   * Parse the websocket data that comes back from the main thread
   */
  const parseWebsocketData = useCallback(() => {
    ipcRenderer.on(SAUCE_IPC_TYPES.WS_STARTED, () => {
      // eslint-disable-next-line no-console
      console.log('Client websocket response = started');
      setWsRunning(true);
    });
    ipcRenderer.on(SAUCE_IPC_TYPES.WS_CLOSED, () => {
      // eslint-disable-next-line no-console
      console.log('Client websocket response = closed');
      setWsRunning(false);
    });
    ipcRenderer.on(SAUCE_IPC_TYPES.WS_ERROR, (event, wsResponse) => {
      // eslint-disable-next-line no-console
      console.log('Client websocket response = ', wsResponse);
      setWsRunning(false);
    });
    ipcRenderer.on(SAUCE_IPC_TYPES.WS_MESSAGE, (event, wsResponse) => {
      handleMessage(wsResponse);
      if (!canvasLoaded) {
        setCanvasLoaded(true);
      }
    });
  }, []);
  /**
   * Close the websocket in the mean thread when we leave the screen
   */
  const closeWebsocket = useCallback(() => {
    // eslint-disable-next-line no-console
    console.log('Client websocket request = stop');
    ipcRenderer.send(SAUCE_IPC_TYPES.CLOSE_WS);
  }, []);

  useEffect(() => {
    runWebSocket();
    parseWebsocketData();
    return () => closeWebsocket();
  }, [runWebSocket, parseWebsocketData, closeWebsocket]);
};

export default webSocketHandler;
