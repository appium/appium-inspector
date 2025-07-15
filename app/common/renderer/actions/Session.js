import {notification} from 'antd';
import _ from 'lodash';
import {Web2Driver} from 'web2driver';

import {
  SAVED_SESSIONS,
  SERVER_ARGS,
  SESSION_SERVER_PARAMS,
  SESSION_SERVER_TYPE,
  VISIBLE_PROVIDERS,
} from '../../shared/setting-defs';
import {SERVER_TYPES, SESSION_BUILDER_TABS} from '../constants/session-builder';
import {APP_MODE} from '../constants/session-inspector';
import i18n from '../i18next';
import {VENDOR_MAP} from '../lib/vendor/map.js';
import {getSetting, ipcRenderer, setSetting} from '../polyfills';
import {fetchSessionInformation, formatSeleniumGridSessions} from '../utils/attaching-to-session';
import {downloadFile, parseSessionFileContents} from '../utils/file-handling';
import {log} from '../utils/logger';
import {addVendorPrefixes} from '../utils/other';
import {quitSession, setSessionDetails} from './Inspector';

export const NEW_SESSION_REQUESTED = 'NEW_SESSION_REQUESTED';
export const NEW_SESSION_LOADING = 'NEW_SESSION_LOADING';
export const NEW_SESSION_DONE = 'NEW_SESSION_DONE';
export const CHANGE_CAPABILITY = 'CHANGE_CAPABILITY';
export const SAVE_SESSION_REQUESTED = 'SAVE_SESSION_REQUESTED';
export const SAVE_SESSION_DONE = 'SAVE_SESSION_DONE';
export const GET_SAVED_SESSIONS_REQUESTED = 'GET_SAVED_SESSIONS_REQUESTED';
export const GET_SAVED_SESSIONS_DONE = 'GET_SAVED_SESSIONS_DONE';
export const SET_CAPABILITY_PARAM = 'SET_CAPABILITY_PARAM';
export const ADD_CAPABILITY = 'ADD_CAPABILITY';
export const REMOVE_CAPABILITY = 'REMOVE_CAPABILITY';
export const SWITCHED_TABS = 'SWITCHED_TABS';
export const SET_CAPS_AND_SERVER = 'SET_CAPS_AND_SERVER';
export const SAVE_AS_MODAL_REQUESTED = 'SAVE_AS_MODAL_REQUESTED';
export const HIDE_SAVE_AS_MODAL_REQUESTED = 'HIDE_SAVE_AS_MODAL_REQUESTED';
export const SET_SAVE_AS_TEXT = 'SET_SAVE_AS_TEXT';
export const DELETE_SAVED_SESSION_REQUESTED = 'DELETE_SAVED_SESSION_REQUESTED';
export const DELETE_SAVED_SESSION_DONE = 'DELETE_SAVED_SESSION_DONE';
export const CHANGE_SERVER_TYPE = 'CHANGE_SERVER_TYPE';
export const SET_SERVER_PARAM = 'SET_SERVER_PARAM';
export const SET_SERVER = 'SET_SERVER';

export const SET_ATTACH_SESS_ID = 'SET_ATTACH_SESS_ID';

export const GET_SESSIONS_REQUESTED = 'GET_SESSIONS_REQUESTED';
export const GET_SESSIONS_DONE = 'GET_SESSIONS_DONE';

export const ENABLE_DESIRED_CAPS_NAME_EDITOR = 'ENABLE_DESIRED_CAPS_NAME_EDITOR';
export const ABORT_DESIRED_CAPS_NAME_EDITOR = 'ABORT_DESIRED_CAPS_NAME_EDITOR';
export const SAVE_DESIRED_CAPS_NAME = 'SAVE_DESIRED_CAPS_NAME';
export const SET_DESIRED_CAPS_NAME = 'SET_DESIRED_CAPS_NAME';

export const ENABLE_DESIRED_CAPS_EDITOR = 'ENABLE_DESIRED_CAPS_EDITOR';
export const ABORT_DESIRED_CAPS_EDITOR = 'ABORT_DESIRED_CAPS_EDITOR';
export const SAVE_RAW_DESIRED_CAPS = 'SAVE_RAW_DESIRED_CAPS';
export const SET_RAW_DESIRED_CAPS = 'SET_RAW_DESIRED_CAPS';
export const SHOW_DESIRED_CAPS_JSON_ERROR = 'SHOW_DESIRED_CAPS_JSON_ERROR';

export const IS_ADDING_CLOUD_PROVIDER = 'IS_ADDING_CLOUD_PROVIDER';

export const SET_PROVIDERS = 'SET_PROVIDERS';

export const SET_ADD_VENDOR_PREFIXES = 'SET_ADD_VENDOR_PREFIXES';

export const SET_CAPABILITY_NAME_ERROR = 'SET_CAPABILITY_NAME_ERROR';
export const SET_STATE_FROM_URL = 'SET_STATE_FROM_URL';
export const SET_STATE_FROM_FILE = 'SET_STATE_FROM_FILE';

const APPIUM_SESSION_FILE_VERSION = '1.0';

const CAPS_NEW_COMMAND = 'appium:newCommandTimeout';
const CAPS_CONNECT_HARDWARE_KEYBOARD = 'appium:connectHardwareKeyboard';
const CAPS_NATIVE_WEB_SCREENSHOT = 'appium:nativeWebScreenshot';
const CAPS_ENSURE_WEBVIEW_HAVE_PAGES = 'appium:ensureWebviewsHavePages';
const CAPS_INCLUDE_SAFARI_IN_WEBVIEWS = 'appium:includeSafariInWebviews';

const AUTO_START_URL_PARAM = '1'; // what should be passed in to ?autoStart= to turn it on

const MJPEG_CAP = 'mjpegScreenshotUrl';
const MJPEG_PORT_CAP = 'mjpegServerPort';

// Multiple requests sometimes send a new session request
// after establishing a session.
// This situation could happen easier on cloud vendors,
// so let's set zero so far.
// TODO: increase this retry when we get issues
export const CONN_RETRIES = 0;
const CONN_TIMEOUT = 5 * 60 * 1000;

// 1 hour default newCommandTimeout
const NEW_COMMAND_TIMEOUT_SEC = 3600;

let isFirstRun = true; // we only want to auto start a session on a first run

export const DEFAULT_SERVER_PATH = '/';
export const DEFAULT_SERVER_HOST = '127.0.0.1';
export const DEFAULT_SERVER_PORT = 4723;

const JSON_TYPES = ['object', 'number', 'boolean'];

export function getCapsObject(caps) {
  return Object.assign(
    {},
    ...caps.map((cap) => {
      if (JSON_TYPES.indexOf(cap.type) !== -1) {
        try {
          let obj = JSON.parse(cap.value);
          return {[cap.name]: obj};
        } catch {}
      }
      return {[cap.name]: cap.value};
    }),
  );
}

export function showError(e, params = {methodName: null, secs: 5, url: null}) {
  const {secs, url} = params;
  let {methodName} = params;
  let errMessage;
  if (e['jsonwire-error'] && e['jsonwire-error'].status === 7) {
    // FIXME: we probably should set 'findElement' as the method name
    // if it is also number.
    if (methodName === 10) {
      methodName = 'findElements';
    }
    errMessage = i18n.t('findElementFailure', {methodName});
    if (e.message) {
      errMessage += ` Original error: '${e.message}'`;
    }
  } else if (e.data) {
    try {
      e.data = JSON.parse(e.data);
    } catch {}
    if (e.data.value && e.data.value.message) {
      errMessage = e.data.value.message;
    } else {
      errMessage = e.data;
    }
  } else if (e.message) {
    errMessage = e.message;
  } else if (e.code) {
    errMessage = e.code;
  } else {
    errMessage = i18n.t('Could not start session');
  }
  if (
    errMessage === 'ECONNREFUSED' ||
    _.includes(errMessage, 'Failed to fetch') ||
    _.includes(errMessage, 'The requested resource could not be found')
  ) {
    errMessage = i18n.t('couldNotConnect', {url});
  }

  log.error(errMessage);
  notification.error({
    message: methodName ? i18n.t('callToMethodFailed', {methodName}) : i18n.t('Error'),
    description: errMessage,
    duration: secs,
  });
}

/**
 * Change the caps object, along with the server details and then go back to the new session tab
 */
export function setCapsAndServer(server, serverType, caps, uuid, name) {
  return (dispatch) => {
    dispatch({type: SET_CAPS_AND_SERVER, server, serverType, caps, uuid, name});
  };
}

/**
 * Change a single desired capability
 */
export function changeCapability(key, value) {
  return (dispatch) => {
    dispatch({type: CHANGE_CAPABILITY, key, value});
  };
}

/**
 * Push a capability to the list
 */
export function addCapability() {
  return (dispatch) => {
    dispatch({type: ADD_CAPABILITY});
  };
}

/**
 * Update value of a capability parameter
 */
export function setCapabilityParam(index, name, value) {
  return (dispatch) => {
    dispatch({type: SET_CAPABILITY_PARAM, index, name, value});
  };
}

/**
 * Delete a capability from the list
 */
export function removeCapability(index) {
  return (dispatch) => {
    dispatch({type: REMOVE_CAPABILITY, index});
  };
}

/**
 * Start a new appium session with the given caps
 */
export function newSession(originalCaps, attachSessId = null) {
  return async (dispatch, getState) => {
    let session = getState().session;

    // first add vendor prefixes to caps if requested
    let prefixedCaps = originalCaps;
    if (!attachSessId && session.addVendorPrefixes) {
      const {server, serverType, capsUUID, capsName} = session;
      prefixedCaps = addVendorPrefixes(originalCaps);
      setCapsAndServer(server, serverType, prefixedCaps, capsUUID, capsName)(dispatch);
    }

    dispatch({type: NEW_SESSION_REQUESTED});

    let sessionCaps = prefixedCaps ? getCapsObject(prefixedCaps) : {};
    sessionCaps = addCustomCaps(sessionCaps);
    let host, port, username, accessKey, https, path, headers;
    //
    // To register a new session vendor:
    // - Implement a new class inherited from VendorBase in app/common/renderer/lib/vendor/<vendor_name>.js
    // - Add the newly created class to the VENDOR_MAP defined in app/common/renderer/lib/vendor/map.js
    //
    /** @type {(new (server: unknown, caps: Record<string, any>) => import('../lib/vendor/base.js').BaseVendor) | undefined} */
    const VendorClass = VENDOR_MAP[session.serverType];
    if (VendorClass) {
      log.info(`Using ${VendorClass.name}`);
      try {
        const vendor = new VendorClass(session.server, sessionCaps);
        ({host, port, username, accessKey, https, path, headers} = await vendor.apply());
      } catch (e) {
        showError(e);
        return false;
      }
    } else {
      log.info(
        `No vendor mapping is defined for the server type '${session.serverType}'. Using defaults`,
      );
    }

    // if the server path is '' (or any other kind of falsy) set it to default
    path = path || DEFAULT_SERVER_PATH;
    host = host || DEFAULT_SERVER_HOST;
    port = port || DEFAULT_SERVER_PORT;

    // TODO W2D handle proxy and rejectUnauthorized cases
    //let rejectUnauthorized = !session.server.advanced.allowUnauthorized;
    //let proxy;
    //if (session.server.advanced.useProxy && session.server.advanced.proxy) {
    //  proxy = session.server.advanced.proxy;
    //}

    dispatch({type: NEW_SESSION_LOADING});

    const protocol = https ? 'https' : 'http';
    const serverUrl = `${protocol}://${host}:${port}${path === '/' ? '' : path}`;
    const serverOpts = {
      hostname: host,
      port: parseInt(port, 10),
      protocol,
      path,
      headers,
      connectionRetryCount: CONN_RETRIES,
      connectionRetryTimeout: CONN_TIMEOUT,
    };

    if (username && accessKey) {
      serverOpts.user = username;
      serverOpts.key = accessKey;
    }

    // If a newCommandTimeout wasn't provided, set it to 60 * 60 so that sessions don't close on users in short term.
    // I saw sometimes infinit session timeout was not so good for cloud providers.
    // So, let me define this value as NEW_COMMAND_TIMEOUT_SEC by default.
    if (_.isUndefined(sessionCaps[CAPS_NEW_COMMAND])) {
      sessionCaps[CAPS_NEW_COMMAND] = NEW_COMMAND_TIMEOUT_SEC;
    }

    // If someone didn't specify connectHardwareKeyboard, set it to true by
    // default
    if (_.isUndefined(sessionCaps[CAPS_CONNECT_HARDWARE_KEYBOARD])) {
      sessionCaps[CAPS_CONNECT_HARDWARE_KEYBOARD] = true;
    }

    serverOpts.logLevel = process.env.NODE_ENV === 'development' ? 'info' : 'warn';

    let driver = null;
    try {
      if (attachSessId) {
        // When attaching to a session id, webdriver does not fully populate client information, so
        // we should supplement by attaching session capabilities that we are attaching to, if they
        // exist in our cache of running appium sessions. Otherwise (in the case where we are
        // autostarting and attaching to a new session, retrieve session details via a server call)
        serverOpts.isMobile = true;
        const attachedSession = session.runningAppiumSessions.find(
          (session) => session.id === attachSessId,
        );
        let attachedSessionCaps = {};
        if (attachedSession) {
          attachedSessionCaps = attachedSession.capabilities;
          if (session.serverType === SERVER_TYPES.LAMBDATEST) {
            // adjust for LambdaTest-specific format
            if ('capabilities' in attachedSessionCaps) {
              attachedSessionCaps = attachedSessionCaps.capabilities;
            }
            if ('desired' in attachedSessionCaps) {
              attachedSessionCaps = attachedSessionCaps.desired;
            }
          }
        } else {
          try {
            const detailsUrl = `${serverUrl}/session/${attachSessId}`;
            const res = await fetchSessionInformation({url: detailsUrl, timeout: CONN_TIMEOUT});
            attachedSessionCaps = res.data.value;
          } catch (err) {
            // rethrow the error as session not running, but first log the original error to console
            log.error(err);
            throw new Error(i18n.t('attachSessionNotRunning', {attachSessId}));
          }
        }
        // Chrome MJSONWP mode returns "platform" instead of "platformName"
        const platformName = attachedSessionCaps.platformName || attachedSessionCaps.platform;
        serverOpts.isIOS = Boolean(platformName.match(/iOS/i));
        serverOpts.isAndroid = Boolean(platformName.match(/Android/i));
        driver = await Web2Driver.attachToSession(attachSessId, serverOpts, attachedSessionCaps);
        driver._isAttachedSession = true;
      } else {
        driver = await Web2Driver.remote(serverOpts, sessionCaps);
      }
    } catch (err) {
      showError(err, {secs: 0, serverUrl});
      return false;
    } finally {
      dispatch({type: NEW_SESSION_DONE});
      // Save the current server settings
      await setSetting(SESSION_SERVER_PARAMS, session.server);
    }

    // The homepage arg in ChromeDriver is not working with Appium. iOS can have a default url, but
    // we want to keep the process equal to prevent complexity so we launch a default url here to make
    // sure we don't start with an empty page which will not show proper HTML in the inspector
    const {browserName = ''} = sessionCaps;
    let appMode = APP_MODE.NATIVE;

    if (browserName.trim() !== '') {
      try {
        appMode = APP_MODE.WEB_HYBRID;
        await driver.navigateTo('https://appium.io');
      } catch {}
    }

    let mjpegScreenshotUrl =
      driver.capabilities[`appium:${MJPEG_CAP}`] || driver.capabilities[MJPEG_CAP] || null;

    const mjpegScreenshotPort =
      driver.capabilities[`appium:${MJPEG_PORT_CAP}`] ||
      driver.capabilities[MJPEG_PORT_CAP] ||
      null;

    // Build mjpegScreenshotUrl if mjpegServerPort in session capabilities
    if (!mjpegScreenshotUrl && mjpegScreenshotPort) {
      mjpegScreenshotUrl = `${protocol}://${host}:${mjpegScreenshotPort}`;
    }

    const action = setSessionDetails({
      serverDetails: {
        username,
        accessKey,
        headers,
        serverUrl,
        serverUrlParts: {
          protocol,
          host,
          port,
          path,
        },
        mjpegScreenshotUrl,
      },
      driver,
      sessionCaps,
      appMode,
      isUsingMjpegMode: mjpegScreenshotUrl !== null,
    });
    action(dispatch);
    return true;
  };
}

/**
 * Saves the caps and server details
 */
export function saveSession(server, serverType, caps, params) {
  return async (dispatch) => {
    let {name, uuid} = params;
    let savedSessions = (await getSetting(SAVED_SESSIONS)) || [];
    let duplicateSessions = savedSessions.filter((session) => session.name === name);
    // Ignore the check if the user is updating an existing capability set with duplicate names
    let isEditingExistingCapability = duplicateSessions.find((session) => session.uuid === uuid);
    if (duplicateSessions.length > 0 && !isEditingExistingCapability) {
      return dispatch({type: SET_CAPABILITY_NAME_ERROR});
    }
    dispatch({type: SAVE_SESSION_REQUESTED});

    if (!uuid) {
      // If it's a new session, add it to the list
      uuid = crypto.randomUUID();
      let newSavedSession = {
        date: Date.now(),
        name,
        uuid,
        caps,
        server,
        serverType,
      };
      savedSessions.push(newSavedSession);
    } else {
      // If it's an existing session, overwrite it
      for (let session of savedSessions) {
        if (session.uuid === uuid) {
          session.name = name;
          session.caps = caps;
          session.server = server;
          session.serverType = serverType;
        }
      }
    }
    await setSetting(SAVED_SESSIONS, savedSessions);
    const action = getSavedSessions();
    await action(dispatch);
    dispatch({type: SET_CAPS_AND_SERVER, server, serverType, caps, uuid, name});
    dispatch({type: SAVE_SESSION_DONE});
  };
}

/**
 * Get the sessions saved by the user
 */
export function getSavedSessions() {
  return async (dispatch) => {
    dispatch({type: GET_SAVED_SESSIONS_REQUESTED});
    let savedSessions = await getSetting(SAVED_SESSIONS);
    dispatch({type: GET_SAVED_SESSIONS_DONE, savedSessions});
  };
}

/**
 * Switch to a different Session Builder tab
 */
export function switchTabs(key) {
  return (dispatch, getState) => {
    dispatch({type: SWITCHED_TABS, key});
    // if switching to Attach to Session tab, also retrieve the running sessions
    if (key === SESSION_BUILDER_TABS.ATTACH_TO_SESSION) {
      getRunningSessions()(dispatch, getState);
    }
  };
}

/**
 * Open a 'Save As' modal
 */
export function requestSaveAsModal() {
  return (dispatch) => {
    dispatch({type: SAVE_AS_MODAL_REQUESTED});
  };
}

/**
 * Hide the 'Save As' modal
 */
export function hideSaveAsModal() {
  return (dispatch) => {
    dispatch({type: HIDE_SAVE_AS_MODAL_REQUESTED});
  };
}

/**
 * Set the text to save capabilities as
 */
export function setSaveAsText(saveAsText) {
  return (dispatch) => {
    dispatch({type: SET_SAVE_AS_TEXT, saveAsText});
  };
}

/**
 * Delete a saved session
 */
export function deleteSavedSession(uuid) {
  return async (dispatch) => {
    dispatch({type: DELETE_SAVED_SESSION_REQUESTED, uuid});
    let savedSessions = await getSetting(SAVED_SESSIONS);
    let newSessions = savedSessions.filter((session) => session.uuid !== uuid);
    await setSetting(SAVED_SESSIONS, newSessions);
    dispatch({type: DELETE_SAVED_SESSION_DONE});
    dispatch({type: GET_SAVED_SESSIONS_DONE, savedSessions: newSessions});
  };
}

/**
 * Set the session id to attach to
 */
export function setAttachSessId(attachSessId) {
  return (dispatch) => {
    dispatch({type: SET_ATTACH_SESS_ID, attachSessId});
  };
}

/**
 * Change the server type
 */
export function changeServerType(serverType) {
  return async (dispatch) => {
    await setSetting(SESSION_SERVER_TYPE, serverType);
    dispatch({type: CHANGE_SERVER_TYPE, serverType});
  };
}

/**
 * Set a server parameter (host, port, etc...)
 */
export function setServerParam(name, value, serverType) {
  return async (dispatch, getState) => {
    serverType = serverType || getState().session.serverType;
    await setSetting(SESSION_SERVER_TYPE, serverType);
    dispatch({type: SET_SERVER_PARAM, serverType, name, value});
  };
}

/**
 * Set the local server hostname and port to whatever was saved in 'actions/StartServer.js' so that it
 * defaults to what the currently running appium server is
 */
export function setLocalServerParams() {
  return async (dispatch, getState) => {
    let serverArgs = await getSetting(SERVER_ARGS);
    // Get saved server args from settings and set local server settings to it. If there are no saved args, set local
    // host and port to undefined
    if (serverArgs) {
      dispatch({
        type: SET_SERVER_PARAM,
        serverType: SERVER_TYPES.LOCAL,
        name: 'port',
        value: serverArgs.port,
      });
      dispatch({
        type: SET_SERVER_PARAM,
        serverType: SERVER_TYPES.LOCAL,
        name: 'hostname',
        value: 'localhost',
      });
    } else {
      dispatch({
        type: SET_SERVER_PARAM,
        serverType: SERVER_TYPES.LOCAL,
        name: 'port',
        value: undefined,
      });
      dispatch({
        type: SET_SERVER_PARAM,
        serverType: SERVER_TYPES.LOCAL,
        name: 'hostname',
        value: undefined,
      });
      if (getState().session.serverType === 'local') {
        const action = changeServerType('remote');
        await action(dispatch, getState);
      }
    }
  };
}

/**
 * Set the server parameters to whatever they were last saved as.
 * Params are saved whenever there's a new session
 */
export function setSavedServerParams() {
  return async (dispatch, getState) => {
    let server = await getSetting(SESSION_SERVER_PARAMS);
    let serverType = await getSetting(SESSION_SERVER_TYPE);
    let currentProviders = getState().session.visibleProviders;

    if (server) {
      // if we have a cloud provider as a saved server, but for some reason the
      // cloud provider is no longer in the list, revert server type to remote
      if (_.values(SERVER_TYPES).includes(serverType) && !currentProviders.includes(serverType)) {
        serverType = SERVER_TYPES.REMOTE;
      }
      dispatch({type: SET_SERVER, server, serverType});
    }
  };
}

/**
 * Checks if the app was launched by opening a file -
 * if yes, set the current server and capability details from the file contents
 */
export function initFromSessionFile() {
  return async (dispatch) => {
    const lastArg = process.argv[process.argv.length - 1];
    if (!lastArg.startsWith('filename=')) {
      return null;
    }
    const filePath = lastArg.split('=')[1];
    const sessionFileString = await ipcRenderer.invoke('sessionfile:open', filePath);
    setStateFromSessionFile(sessionFileString)(dispatch);
  };
}

/**
 * Sets the current server and capability details using the provided .appiumsession file contents
 */
export function setStateFromSessionFile(sessionFileString) {
  return (dispatch, getState) => {
    const sessionJSON = parseSessionFileContents(sessionFileString);
    if (sessionJSON === null) {
      notification.error({
        message: i18n.t('invalidSessionFile'),
        duration: 0,
      });
      return;
    }
    dispatch({type: SET_STATE_FROM_FILE, sessionJSON});
    switchTabs(SESSION_BUILDER_TABS.CAPS_BUILDER)(dispatch, getState);
  };
}

/**
 * Packages the current server and capability details in an .appiumsession file
 */
export function saveSessionAsFile() {
  return (_dispatch, getState) => {
    const state = getState().session;
    const sessionFileDetails = {
      version: APPIUM_SESSION_FILE_VERSION,
      caps: state.caps,
      server: state.server,
      serverType: state.serverType,
      visibleProviders: state.visibleProviders,
    };
    const href = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(sessionFileDetails, null, 2),
    )}`;
    const fileName = `${state.serverType}.appiumsession`;
    downloadFile(href, fileName);
  };
}

/**
 * Retrieve all running sessions for the currently configured server details
 */
export function getRunningSessions() {
  return async (dispatch, getState) => {
    const avoidServerTypes = ['sauce'];
    const state = getState().session;
    const {server, serverType, attachSessId} = state;
    let {hostname, port, path, ssl, username, accessKey} = server[serverType];
    const authToken = username && accessKey ? btoa(`${username}:${accessKey}`) : null;

    // if we have a standard remote server, fill out connection info based on placeholder defaults
    // in case the user hasn't adjusted those fields
    if (serverType === SERVER_TYPES.REMOTE) {
      hostname = hostname || DEFAULT_SERVER_HOST;
      port = port || DEFAULT_SERVER_PORT;
      path = path || DEFAULT_SERVER_PATH;
    }

    // no need to get sessions if we don't have complete server info
    if (!hostname || !port || !path) {
      return;
    }

    dispatch({type: GET_SESSIONS_REQUESTED});
    if (avoidServerTypes.includes(serverType)) {
      dispatch({type: GET_SESSIONS_DONE});
      return;
    }

    const adjPath = path.endsWith('/') ? path : `${path}/`;
    const baseUrl = `http${ssl ? 's' : ''}://${hostname}:${port}${adjPath}`;
    const sessions = await fetchAllSessions(baseUrl, authToken);
    dispatch({type: GET_SESSIONS_DONE, sessions});

    // set attachSessId if only one session found
    if (sessions.length === 1) {
      dispatch({type: SET_ATTACH_SESS_ID, attachSessId: sessions[0].id});
    } else if (attachSessId) {
      // clear attachSessId if it is no longer present in the found session list
      const attachSessIdFound = sessions.find((session) => session.id === attachSessId);
      if (!attachSessIdFound) {
        dispatch({type: SET_ATTACH_SESS_ID, attachSessId: null});
      }
    }
  };
}

async function fetchAllSessions(baseUrl, authToken) {
  const appiumSessionsEndpoint = `${baseUrl}appium/sessions`; // Appium 3+
  const oldAppiumSessionsEndpoint = `${baseUrl}sessions`; // Appium 1-2
  const seleniumSessionsEndpoint = `${baseUrl}status`;

  async function fetchSessionsFromEndpoint(url) {
    try {
      const res = await fetchSessionInformation({url, authToken});
      return url === seleniumSessionsEndpoint
        ? formatSeleniumGridSessions(res)
        : (res.data.value ?? []);
    } catch {
      return [];
    }
  }

  const [appiumSessions, oldAppiumSessions, seleniumSessions] = await Promise.all([
    fetchSessionsFromEndpoint(appiumSessionsEndpoint),
    fetchSessionsFromEndpoint(oldAppiumSessionsEndpoint),
    fetchSessionsFromEndpoint(seleniumSessionsEndpoint),
  ]);

  return [...appiumSessions, ...oldAppiumSessions, ...seleniumSessions];
}

export function startDesiredCapsNameEditor() {
  return (dispatch) => {
    dispatch({type: ENABLE_DESIRED_CAPS_NAME_EDITOR});
  };
}

export function abortDesiredCapsNameEditor() {
  return (dispatch) => {
    dispatch({type: ABORT_DESIRED_CAPS_NAME_EDITOR});
  };
}

export function saveDesiredCapsName() {
  return (dispatch, getState) => {
    const {server, serverType, caps, capsUUID, desiredCapsName} = getState().session;
    dispatch({type: SAVE_DESIRED_CAPS_NAME, name: desiredCapsName});
    saveSession(server, serverType, caps, {name: desiredCapsName, uuid: capsUUID})(dispatch);
  };
}

export function setDesiredCapsName(desiredCapsName) {
  return (dispatch) => {
    dispatch({type: SET_DESIRED_CAPS_NAME, desiredCapsName});
  };
}

export function startDesiredCapsEditor() {
  return (dispatch) => {
    dispatch({type: ENABLE_DESIRED_CAPS_EDITOR});
  };
}

export function abortDesiredCapsEditor() {
  return (dispatch) => {
    dispatch({type: ABORT_DESIRED_CAPS_EDITOR});
  };
}

export function saveRawDesiredCaps() {
  return (dispatch, getState) => {
    const state = getState().session;
    const {rawDesiredCaps, caps: capsArray} = state;
    try {
      const newCaps = JSON.parse(rawDesiredCaps);

      // Transform the current caps array to an object
      let caps = {};
      for (let {type, name, value} of capsArray) {
        caps[name] = {type, value};
      }

      // Translate the caps JSON to array format
      let newCapsArray = _.toPairs(newCaps).map(([name, value]) => ({
        type: (() => {
          let type = typeof value;

          // If we already have this cap and it's file type, keep the type the same
          if (caps[name] && caps[name].type === 'file' && type === 'string') {
            return 'file';
          } else if (type === 'string') {
            return 'text';
          } else {
            return type;
          }
        })(),
        name,
        value,
      }));
      dispatch({type: SAVE_RAW_DESIRED_CAPS, caps: newCapsArray});
    } catch (e) {
      dispatch({type: SHOW_DESIRED_CAPS_JSON_ERROR, message: e.message});
    }
  };
}

export function setRawDesiredCaps(rawDesiredCaps) {
  return (dispatch, getState) => {
    const state = getState().session;
    let isValidCapsJson = true;
    let invalidCapsJsonReason;
    if (state.isValidatingCapsJson) {
      try {
        JSON.parse(rawDesiredCaps);
      } catch (e) {
        isValidCapsJson = false;
        invalidCapsJsonReason = e.message;
      }
    }
    dispatch({type: SET_RAW_DESIRED_CAPS, rawDesiredCaps, isValidCapsJson, invalidCapsJsonReason});
  };
}

export function addCloudProvider() {
  return (dispatch) => {
    dispatch({type: IS_ADDING_CLOUD_PROVIDER, isAddingProvider: true});
  };
}

export function stopAddCloudProvider() {
  return (dispatch) => {
    dispatch({type: IS_ADDING_CLOUD_PROVIDER, isAddingProvider: false});
  };
}

export function addVisibleProvider(provider) {
  return async (dispatch, getState) => {
    let currentProviders = getState().session.visibleProviders;
    const providers = _.union(currentProviders, [provider]);
    await setSetting(VISIBLE_PROVIDERS, providers);
    dispatch({type: SET_PROVIDERS, providers});
  };
}

export function removeVisibleProvider(provider) {
  return async (dispatch, getState) => {
    const {serverType, visibleProviders} = getState().session;
    if (serverType === provider) {
      const action = changeServerType('remote');
      await action(dispatch, getState);
    }
    const providers = _.without(visibleProviders, provider);
    await setSetting(VISIBLE_PROVIDERS, providers);
    dispatch({type: SET_PROVIDERS, providers});
  };
}

export function setVisibleProviders() {
  return async (dispatch) => {
    const providers = await getSetting(VISIBLE_PROVIDERS);
    dispatch({type: SET_PROVIDERS, providers});
  };
}

/**
 * Add custom capabilities
 *
 * @param {object} caps
 */
function addCustomCaps(caps) {
  const {platformName = ''} = caps;
  const androidCustomCaps = {};
  // @TODO: remove when this is defaulted in the newest Appium 1.8.x release
  androidCustomCaps[CAPS_ENSURE_WEBVIEW_HAVE_PAGES] = true;
  // Make sure the screenshot is taken of the whole screen when the ChromeDriver is used
  androidCustomCaps[CAPS_NATIVE_WEB_SCREENSHOT] = true;

  const iosCustomCaps = {};
  // Always add the includeSafariInWebviews for future HTML detection
  // This will ensure that if you use AD to switch between App and browser
  // that it can detect Safari as a webview
  iosCustomCaps[CAPS_INCLUDE_SAFARI_IN_WEBVIEWS] = true;

  return {
    ...caps,
    ...(platformName.toLowerCase() === 'android' ? androidCustomCaps : {}),
    ...(platformName.toLowerCase() === 'ios' ? iosCustomCaps : {}),
  };
}

export function bindWindowClose() {
  return (dispatch, getState) => {
    window.addEventListener('beforeunload', async (evt) => {
      let {driver} = getState().inspector;
      if (driver) {
        try {
          const action = quitSession('Window closed');
          await action(dispatch, getState);
        } finally {
          driver = null;
        }
      }

      // to allow the window close to continue, the thing we must do is make sure the event no
      // longer has any 'returnValue' property
      delete evt.returnValue;
    });
  };
}

export function setAddVendorPrefixes(addVendorPrefixes) {
  return (dispatch) => {
    dispatch({type: SET_ADD_VENDOR_PREFIXES, addVendorPrefixes});
  };
}

export function initFromQueryString(loadNewSession) {
  return (dispatch, getState) => {
    if (!isFirstRun) {
      return;
    }

    isFirstRun = false;

    const url = new URL(window.location.href);
    const initialState = url.searchParams.get('state');
    const autoStartSession = url.searchParams.get('autoStart');

    if (initialState) {
      try {
        const state = JSON.parse(initialState);
        dispatch({type: SET_STATE_FROM_URL, state});
      } catch {
        showError(new Error('Could not parse initial state from URL'), {secs: 0});
      }
    }

    if (autoStartSession === AUTO_START_URL_PARAM) {
      const {attachSessId, caps} = getState().session;
      if (attachSessId) {
        return loadNewSession(null, attachSessId);
      }
      loadNewSession(caps);
    }
  };
}
