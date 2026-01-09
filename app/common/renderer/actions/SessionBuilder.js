import _ from 'lodash';
import sanitize from 'sanitize-filename';

import {
  SAVED_SESSIONS,
  SERVER_ARGS,
  SESSION_SERVER_PARAMS,
  SESSION_SERVER_TYPE,
  VISIBLE_PROVIDERS,
} from '../../shared/setting-defs.js';
import {
  DEFAULT_SESSION_NAME,
  SERVER_TYPES,
  SESSION_BUILDER_TABS,
  SESSION_FILE_VERSIONS,
} from '../constants/session-builder.js';
import {APP_MODE} from '../constants/session-inspector.js';
import {DEFAULT_SERVER_PROPS} from '../constants/webdriver.js';
import i18n from '../i18next.js';
import WDSessionStarter from '../lib/appium/session-starter.js';
import {VENDOR_MAP} from '../lib/vendor/map.js';
import {getSetting, ipcRenderer, setSetting} from '../polyfills.js';
import {
  fetchSessionInformation,
  formatSeleniumGridSessions,
} from '../utils/attaching-to-session.js';
import {downloadFile, readTextFromUploadedFiles} from '../utils/file-handling.js';
import {log} from '../utils/logger.js';
import {notification} from '../utils/notification.js';
import {addVendorPrefixes} from '../utils/other.js';
import {parseSessionFileContents} from '../utils/sessionfile-parsing.js';
import {quitSession, setSessionDetails} from './SessionInspector.js';

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

export const SESSION_UPLOAD_REQUESTED = 'SESSION_UPLOAD_REQUESTED';
export const SESSION_UPLOAD_DONE = 'SESSION_UPLOAD_DONE';

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

const JSON_TYPES = ['object', 'number', 'boolean'];

export function getCapsObject(caps) {
  return Object.assign(
    {},
    ...caps
      .filter((cap) => cap.enabled)
      .map((cap) => {
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
    if (e.data.value?.message) {
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
    title: methodName ? i18n.t('callToMethodFailed', {methodName}) : i18n.t('Error'),
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
export function setCapabilityParam(id, name, value) {
  return (dispatch) => {
    dispatch({type: SET_CAPABILITY_PARAM, id, name, value});
  };
}

/**
 * Delete a capability from the list
 */
export function removeCapability(id) {
  return (dispatch) => {
    dispatch({type: REMOVE_CAPABILITY, id});
  };
}

/**
 * Start a new appium session with the given caps
 */
export function newSession(originalCaps, attachSessId = null) {
  return async (dispatch, getState) => {
    let session = getState().builder;

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

    const vendorProperties = await retrieveVendorProperties({
      server: session.server,
      serverType: session.serverType,
      sessionCaps,
    });

    if (!vendorProperties) {
      return false;
    }

    dispatch({type: NEW_SESSION_LOADING});

    // Assemble server options from the vendor properties

    let {host, port, username, accessKey, https, path, headers} = vendorProperties;
    const protocol = https ? 'https' : 'http';

    // if the server path is '' (or any other kind of falsy) set it to default
    path = path || DEFAULT_SERVER_PROPS.path;
    host = host || DEFAULT_SERVER_PROPS.hostname;
    port = port || DEFAULT_SERVER_PROPS.port;

    const serverUrl = `${protocol}://${host}:${port}${path === '/' ? '' : path}`;

    const serverOpts = {
      hostname: host,
      port: parseInt(port, 10),
      protocol,
      path,
      headers,
      connectionRetryCount: CONN_RETRIES,
      connectionRetryTimeout: CONN_TIMEOUT,
      logLevel: DEFAULT_SERVER_PROPS.logLevel,
    };
    if (username && accessKey) {
      serverOpts.user = username;
      serverOpts.key = accessKey;
    }

    // If a newCommandTimeout wasn't provided, set it to 60 * 60 so that sessions don't close on users in short term.
    // I saw sometimes infinite session timeout was not so good for cloud providers.
    // So, let me define this value as NEW_COMMAND_TIMEOUT_SEC by default.
    if (_.isUndefined(sessionCaps[CAPS_NEW_COMMAND])) {
      sessionCaps[CAPS_NEW_COMMAND] = NEW_COMMAND_TIMEOUT_SEC;
    }

    // If someone didn't specify connectHardwareKeyboard, set it to true by
    // default
    if (_.isUndefined(sessionCaps[CAPS_CONNECT_HARDWARE_KEYBOARD])) {
      sessionCaps[CAPS_CONNECT_HARDWARE_KEYBOARD] = true;
    }

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
            const res = await fetchSessionInformation({
              url: detailsUrl,
              headers,
              timeout: CONN_TIMEOUT,
            });
            attachedSessionCaps = res.value;
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
        driver = WDSessionStarter.attachToSession(attachSessId, serverOpts, attachedSessionCaps);
      } else {
        driver = await WDSessionStarter.newSession(serverOpts, sessionCaps);
      }
    } catch (err) {
      showError(err, {secs: 0, url: serverUrl});
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

    let mjpegScreenshotPort =
      driver.capabilities[`appium:${MJPEG_PORT_CAP}`] ||
      driver.capabilities[MJPEG_PORT_CAP] ||
      null;

    if (session.serverType === SERVER_TYPES.FIREFLINKDEVICEFARM) {
      mjpegScreenshotUrl = null;
      mjpegScreenshotPort = null;
    }

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
export function saveSession(sessionParams, checkDuplicateName = false) {
  return async (dispatch) => {
    const {server, serverType, caps, name, uuid: foundUUID} = sessionParams;
    const savedSessions = (await getSetting(SAVED_SESSIONS)) || [];
    if (checkDuplicateName) {
      const duplicateSessionNameExists = savedSessions.some((session) => session.name === name);
      if (duplicateSessionNameExists) {
        return dispatch({type: SET_CAPABILITY_NAME_ERROR});
      }
    }
    dispatch({type: SAVE_SESSION_REQUESTED});

    let uuid = foundUUID;
    if (!uuid) {
      // If it's a new session, add it to the list
      uuid = crypto.randomUUID();
      const newSavedSession = {
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
      for (const session of savedSessions) {
        if (session.uuid === uuid) {
          session.name = name;
          session.caps = caps;
          session.server = server;
          session.serverType = serverType;
          break;
        }
      }
    }
    await setSetting(SAVED_SESSIONS, savedSessions);
    await getSavedSessions()(dispatch);
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
    serverType = serverType || getState().builder.serverType;
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
      if (getState().builder.serverType === 'local') {
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
    let currentProviders = getState().builder.visibleProviders;

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
 * if yes, switch to capability builder and set the current details from the file contents
 */
export function initFromSessionFile() {
  return async (dispatch, getState) => {
    const lastArg = process.argv[process.argv.length - 1];
    if (!lastArg?.startsWith('filename=')) {
      return null;
    }
    const filePath = lastArg.split('=')[1];
    const sessionFileString = await ipcRenderer.invoke('sessionfile:open', filePath);
    const sessionJSON = parseAndValidateSessionFileString(sessionFileString);
    if (sessionJSON) {
      dispatch({type: SET_STATE_FROM_FILE, sessionJSON});
      switchTabs(SESSION_BUILDER_TABS.CAPS_BUILDER)(dispatch, getState);
    } else {
      notification.error({
        title: i18n.t('invalidSessionFile'),
        duration: 0,
      });
    }
  };
}

/**
 * Reads one or more .appiumsession files, then extracts, validates, and saves
 * their details as new session sets.
 * Duplicate session names are intentionally OK
 */
export function importSessionFiles(fileList) {
  return async (dispatch) => {
    dispatch({type: SESSION_UPLOAD_REQUESTED});
    const sessions = await readTextFromUploadedFiles(fileList);
    const invalidSessionFiles = [];
    const parsedSessions = [];
    for (const session of sessions) {
      const {fileName, content, error} = session;
      // Some error occurred while reading the uploaded file
      if (error) {
        invalidSessionFiles.push(fileName);
        continue;
      }
      const sessionJSON = parseAndValidateSessionFileString(content);
      if (!sessionJSON) {
        invalidSessionFiles.push(fileName);
        continue;
      }
      parsedSessions.push(sessionJSON);
    }

    for (const parsedSession of parsedSessions) {
      await saveSession(parsedSession)(dispatch);
    }
    dispatch({type: SESSION_UPLOAD_DONE});

    if (!_.isEmpty(invalidSessionFiles)) {
      notification.error({
        title: i18n.t('unableToImportSessionFiles', {fileNames: invalidSessionFiles.join(', ')}),
        duration: 0,
      });
    }
  };
}

function parseAndValidateSessionFileString(sessionFileString) {
  const sessionJSON = parseSessionFileContents(sessionFileString);
  if (sessionJSON === null) {
    return null;
  }
  sessionJSON.serverType = Object.keys(sessionJSON.server).find(
    (type) => type !== SERVER_TYPES.ADVANCED,
  );
  sessionJSON.visibleProviders =
    sessionJSON.serverType !== SERVER_TYPES.REMOTE ? [sessionJSON.serverType] : [];
  return sessionJSON;
}

/**
 * Packages the current server and capability details in an .appiumsession file
 */
export function exportSavedSession(session) {
  return async () => {
    const cleanedName = session.name?.trim() || DEFAULT_SESSION_NAME;
    const cleanedServer = {
      [session.serverType]: session.server[session.serverType],
      [SERVER_TYPES.ADVANCED]: session.server[SERVER_TYPES.ADVANCED],
    };
    const cleanedCaps = session.caps.map((cap) => _.omit(cap, 'id'));
    const sessionFileDetails = {
      version: SESSION_FILE_VERSIONS.LATEST,
      name: cleanedName,
      server: cleanedServer,
      caps: cleanedCaps,
    };
    const href = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(sessionFileDetails, null, 2),
    )}`;
    const escapedName = sanitize(cleanedName, {replacement: '_'});
    const fileName = `${escapedName}.appiumsession`;
    downloadFile(href, fileName);
  };
}

/**
 * @returns {Promise<VendorProperties | false | {}>}
 */
async function retrieveVendorProperties({server, serverType, sessionCaps}) {
  //
  // To register a new session vendor:
  // - Implement a new class inherited from VendorBase in app/common/renderer/lib/vendor/<vendor_name>.js
  // - Add the newly created class to the VENDOR_MAP defined in app/common/renderer/lib/vendor/map.js
  //
  const VendorClass = VENDOR_MAP[serverType];

  if (!VendorClass) {
    log.info(`No vendor mapping is defined for the server type '${serverType}'. Using defaults`);

    return {};
  }

  log.info(`Using ${VendorClass.name}`);

  try {
    const vendor = new VendorClass(server, sessionCaps);
    return await vendor.apply();
  } catch (e) {
    showError(e);
    return false;
  }
}

/**
 * Retrieve all running sessions for the currently configured server details
 */
export function getRunningSessions() {
  return async (dispatch, getState) => {
    const avoidServerTypes = ['sauce'];
    const state = getState().builder;
    const {server, serverType, attachSessId} = state;
    const vendorProperties = await retrieveVendorProperties({
      server,
      serverType,
      sessionCaps: {},
    });

    if (!vendorProperties) {
      return;
    }

    let {path, host, port, username, accessKey, https, headers} = vendorProperties;

    if (username && accessKey) {
      const authToken = btoa(`${username}:${accessKey}`);

      headers = {
        ...headers,
        Authorization: `Basic ${authToken}`,
      };
    }

    // if we have a standard remote server, fill out connection info based on placeholder defaults
    // in case the user hasn't adjusted those fields
    if (serverType === SERVER_TYPES.REMOTE) {
      host = host || DEFAULT_SERVER_PROPS.hostname;
      port = port || DEFAULT_SERVER_PROPS.port;
      path = path || DEFAULT_SERVER_PROPS.path;
    }

    // no need to get sessions if we don't have complete server info
    if (!host || !port || !path) {
      showError(new Error(i18n.t('missingServerInfo')));
      return;
    }

    dispatch({type: GET_SESSIONS_REQUESTED});
    if (avoidServerTypes.includes(serverType)) {
      dispatch({type: GET_SESSIONS_DONE});
      return;
    }

    const protocol = https ? 'https' : 'http';
    const adjPath = path.endsWith('/') ? path : `${path}/`;
    const baseUrl = `${protocol}://${host}:${port}${adjPath}`;
    const sessions = await fetchAllSessions(baseUrl, headers);
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

async function fetchAllSessions(baseUrl, headers) {
  const appiumSessionsEndpoint = `${baseUrl}appium/sessions`; // Appium 3+
  const oldAppiumSessionsEndpoint = `${baseUrl}sessions`; // Appium 1-2
  const seleniumSessionsEndpoint = `${baseUrl}status`;

  async function fetchSessionsFromEndpoint(url) {
    try {
      const res = await fetchSessionInformation({url, headers});
      return url === seleniumSessionsEndpoint ? formatSeleniumGridSessions(res) : (res.value ?? []);
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
    const {server, serverType, caps, capsUUID, desiredCapsName} = getState().builder;
    dispatch({type: SAVE_DESIRED_CAPS_NAME, name: desiredCapsName});
    saveSession({server, serverType, caps, name: desiredCapsName, uuid: capsUUID}, true)(dispatch);
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

// Overwrite the current caps array with the raw data:
// * New caps get a new id, type, and enabled state set to true;
// * Existing caps keep their id and enabled state, but their type is updated.
export function saveRawDesiredCaps(currentCapsArray, rawDesiredCaps) {
  return (dispatch) => {
    try {
      const rawCapsObj = JSON.parse(rawDesiredCaps);

      // Since the user may change the order of existing caps in the raw array,
      // we cannot use the element index - however, since the raw cap names are unique
      // (due to being JSON keys), use that as the identifier.
      // But if the user has changed the name of an existing cap, treat it as a new cap.

      // First, convert the current caps array to an object, in order to use name indexing.
      // This also removes any entries with duplicate names (the capability builder allows duplicates),
      // which is fine, since JSON only allows the latest entry anyway.
      const currentCapsObj = _.fromPairs(
        currentCapsArray.map((cap) => [cap.name, _.omit(cap, 'name')]),
      );

      // Translate the raw caps JSON to array format
      const newCapsArray = Object.entries(rawCapsObj).map(([name, value]) => ({
        id: crypto.randomUUID(),
        enabled: true,
        ...currentCapsObj[name], // overrides id and enabled, if present
        type: typeof value === 'string' ? 'text' : typeof value,
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
    const state = getState().builder;
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
    let currentProviders = getState().builder.visibleProviders;
    const providers = _.union(currentProviders, [provider]);
    await setSetting(VISIBLE_PROVIDERS, providers);
    dispatch({type: SET_PROVIDERS, providers});
  };
}

export function removeVisibleProvider(provider) {
  return async (dispatch, getState) => {
    const {serverType, visibleProviders} = getState().builder;
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

/**
 * Extract port from URL and set it in server state when running in browser/plugin mode
 * This is useful when the inspector is accessed via the plugin at http://localhost:PORT/inspector
 * The port from the URL takes precedence when running in plugin mode
 */
export function setPortFromUrl() {
  return async (dispatch, getState) => {
    if (typeof window === 'undefined' || !window.location) {
      return;
    }

    try {
      const url = new URL(window.location.href);
      const port = url.port;

      if (port && (url.pathname === '/inspector' || url.pathname.startsWith('/inspector/'))) {
        const parsedPort = parseInt(port, 10);
        if (!isNaN(parsedPort) && parsedPort > 0 && parsedPort <= 65535) {
          await setServerParam('port', parsedPort.toString())(dispatch, getState);
        }
      }
    } catch (e) {
      log.debug('Could not extract port from URL:', e);
    }
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
      const {attachSessId, caps} = getState().builder;
      if (attachSessId) {
        return loadNewSession(null, attachSessId);
      }
      loadNewSession(caps);
    }
  };
}
