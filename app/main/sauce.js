import WebSocket from 'ws';

const SAUCE_IPC_TYPES = {
  CLOSE_WS: 'closeWebsocket',
  RUN_WS: 'runWebsocket',
  START_WS: 'startWebsocket',
  WS_CLOSED: 'websocketClosed',
  WS_ERROR: 'websocketError',
  WS_MESSAGE: 'websocketMessage',
  WS_STARTED: 'websocketStarted',
};

let wss = null;

/**
 * Start the websocket and process the data
 *
 * @param {object} event
 * @param {object} websocketData
 * @param {string} websocketData.accessKey
 * @param {string} websocketData.dataCenter
 * @param {string} websocketData.sessionId
 * @param {string} websocketData.username
 */
function runWebSocket (event, { accessKey, dataCenter, sessionId, username }) {
  const wsUrl = `wss://api.${dataCenter}.saucelabs.com/v1/rdc/socket/alternativeIo/${sessionId}`;
  wss = new WebSocket(wsUrl, {
    headers: {
      Authorization: `Basic ${new Buffer.from(
        `${username}:${accessKey}`
      ).toString('base64')}`,
    },
  });
  wss.onopen = () => {
    event.sender.send(SAUCE_IPC_TYPES.WS_STARTED);
  };
  wss.onclose = () => {
    event.sender.send(SAUCE_IPC_TYPES.WS_CLOSED);
  };
  wss.onerror = (e) => {
    event.sender.send(SAUCE_IPC_TYPES.WS_ERROR, e);
  };
  wss.onmessage = (e) => {
    event.sender.send(SAUCE_IPC_TYPES.WS_MESSAGE, e.data);
    wss.send('n/');
  };
}
/**
 * Close the websocket
 */
function closeWebsocket () {
  if (wss) {
    wss.close();
  }
}

export { closeWebsocket, runWebSocket, SAUCE_IPC_TYPES };
