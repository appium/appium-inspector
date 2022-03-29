import { getSetting, setSetting, SAVED_SESSIONS, SERVER_ARGS, SESSION_SERVER_TYPE,
         SESSION_SERVER_PARAMS } from '../../shared/settings';
import { v4 as UUID } from 'uuid';
import { push } from 'connected-react-router';
import { notification } from 'antd';
import { includes, debounce, toPairs, union, without, keys, isUndefined, isPlainObject } from 'lodash';
import { setSessionDetails, quitSession } from './Inspector';
import i18n from '../../configs/i18next.config.renderer';
import CloudProviders from '../components/Session/CloudProviders';
import { Web2Driver } from 'web2driver';
import { addVendorPrefixes } from '../util';
import ky from 'ky/umd';
import moment from 'moment';

export const NEW_SESSION_REQUESTED = 'NEW_SESSION_REQUESTED';
export const NEW_SESSION_BEGAN = 'NEW_SESSION_BEGAN';
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
export const SET_CAPS = 'SET_CAPS';
export const SAVE_AS_MODAL_REQUESTED = 'SAVE_AS_MODAL_REQUESTED';
export const HIDE_SAVE_AS_MODAL_REQUESTED = 'HIDE_SAVE_AS_MODAL_REQUESTED';
export const SET_SAVE_AS_TEXT = 'SET_SAVE_AS_TEXT';
export const DELETE_SAVED_SESSION_REQUESTED = 'DELETE_SAVED_SESSION_REQUESTED';
export const DELETE_SAVED_SESSION_DONE = 'DELETE_SAVED_SESSION_DONE';
export const CHANGE_SERVER_TYPE = 'CHANGE_SERVER_TYPE';
export const SET_SERVER_PARAM = 'SET_SERVER_PARAM';
export const SET_SERVER = 'SET_SERVER';
export const SESSION_LOADING = 'SESSION_LOADING';
export const SESSION_LOADING_DONE = 'SESSION_LOADING_DONE';

export const VISIBLE_PROVIDERS = 'VISIBLE_PROVIDERS';

export const SET_ATTACH_SESS_ID = 'SET_ATTACH_SESS_ID';

export const GET_SESSIONS_REQUESTED = 'GET_SESSIONS_REQUESTED';
export const GET_SESSIONS_DONE = 'GET_SESSIONS_DONE';


export const ENABLE_DESIRED_CAPS_EDITOR = 'ENABLE_DESIRED_CAPS_EDITOR';
export const ABORT_DESIRED_CAPS_EDITOR = 'ABORT_DESIRED_CAPS_EDITOR';
export const SAVE_RAW_DESIRED_CAPS = 'SAVE_RAW_DESIRED_CAPS';
export const SET_RAW_DESIRED_CAPS = 'SET_RAW_DESIRED_CAPS';
export const SHOW_DESIRED_CAPS_JSON_ERROR = 'SHOW_DESIRED_CAPS_JSON_ERROR';

export const IS_ADDING_CLOUD_PROVIDER = 'IS_ADDING_CLOUD_PROVIDER';

export const SET_PROVIDERS = 'SET_PROVIDERS';

export const SET_ADD_VENDOR_PREFIXES = 'SET_ADD_VENDOR_PREFIXES';

export const SET_STATE_FROM_URL = 'SET_STATE_FROM_URL';


const CAPS_NEW_COMMAND = 'appium:newCommandTimeout';
const CAPS_CONNECT_HARDWARE_KEYBOARD = 'appium:connectHardwareKeyboard';
const CAPS_NATIVE_WEB_SCREENSHOT = 'appium:nativeWebScreenshot';
const CAPS_ENSURE_WEBVIEW_HAVE_PAGES = 'appium:ensureWebviewsHavePages';
const CAPS_INCLUDE_SAFARI_IN_WEBVIEWS = 'appium:includeSafariInWebviews';

const AUTO_START_URL_PARAM = '1'; // what should be passed in to ?autoStart= to turn it on

// Multiple requests sometimes send a new session request
// after establishing a session.
// This situation could happen easier on cloud vendors,
// so let's set zero so far.
// TODO: increase this retry when we get issues
export const CONN_RETRIES = 0;

// 1 hour default newCommandTimeout
const NEW_COMMAND_TIMEOUT_SEC = 3600;

let isFirstRun = true; // we only want to auto start a session on a first run

const serverTypes = {};
for (const key of keys(CloudProviders)) {
  serverTypes[key] = key;
}
serverTypes.local = 'local';
serverTypes.remote = 'remote';

export const ServerTypes = serverTypes;

export const DEFAULT_SERVER_PATH = '/';
export const DEFAULT_SERVER_HOST = '127.0.0.1';
export const DEFAULT_SERVER_PORT = 4723;

const SAUCE_OPTIONS_CAP = 'sauce:options';

const JSON_TYPES = ['object', 'number', 'boolean'];

export function getCapsObject (caps) {
  return Object.assign({}, ...(caps.map((cap) => {
    if (JSON_TYPES.indexOf(cap.type) !== -1) {
      try {
        let obj = JSON.parse(cap.value);
        return {[cap.name]: obj};
      } catch (ign) {}
    }
    return {[cap.name]: cap.value};
  })));
}

export function showError (e, methodName, secs = 5) {
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
    } catch (ign) {}
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
  if (errMessage === 'ECONNREFUSED' || includes(errMessage, 'Failed to fetch')) {
    errMessage = i18n.t('couldNotConnect');
  }

  notification.error({
    message: methodName ? i18n.t('callToMethodFailed', {methodName}) : i18n.t('Error'),
    description: errMessage,
    duration: secs
  });

}

/**
 * Change the caps object and then go back to the new session tab
 */
export function setCaps (caps, uuid) {
  return (dispatch) => {
    dispatch({type: SET_CAPS, caps, uuid});
  };
}

/**
 * Change a single desired capability
 */
export function changeCapability (key, value) {
  return (dispatch) => {
    dispatch({type: CHANGE_CAPABILITY, key, value});
  };
}

/**
 * Push a capability to the list
 */
export function addCapability () {
  return (dispatch) => {
    dispatch({type: ADD_CAPABILITY});
  };
}

/**
 * Update value of a capability parameter
 */
export function setCapabilityParam (index, name, value) {
  return (dispatch) => {
    dispatch({type: SET_CAPABILITY_PARAM, index, name, value});
  };
}

/**
 * Delete a capability from the list
 */
export function removeCapability (index) {
  return (dispatch) => {
    dispatch({type: REMOVE_CAPABILITY, index});
  };
}

function _addVendorPrefixes (caps, dispatch, getState) {
  const prefixedCaps = addVendorPrefixes(caps);
  setCaps(prefixedCaps, getState().session.capsUUID)(dispatch);
  return prefixedCaps;
}

/**
 * Start a new appium session with the given caps
 */
export function newSession (caps, attachSessId = null) {
  return async (dispatch, getState) => {
    let session = getState().session;

    // first add vendor prefixes to caps if requested
    if (!attachSessId && session.addVendorPrefixes) {
      caps = _addVendorPrefixes(caps, dispatch, getState);
    }

    dispatch({type: NEW_SESSION_REQUESTED, caps});

    let desiredCapabilities = caps ? getCapsObject(caps) : {};
    let host, port, username, accessKey, https, path, token;
    let isProxyChecked;
    desiredCapabilities = addCustomCaps(desiredCapabilities);

    switch (session.serverType) {
      case ServerTypes.local:
        host = session.server.local.hostname;
        if (host === '0.0.0.0') {
          // if we're on windows, we won't be able to connect directly to '0.0.0.0'
          // so just connect to localhost; if we're listening on all interfaces,
          // that will of course include 127.0.0.1 on all platforms
          host = 'localhost';
        }
        port = session.server.local.port;
        break;
      case ServerTypes.remote:
        host = session.server.remote.hostname;
        port = session.server.remote.port;
        path = session.server.remote.path;
        https = session.server.remote.ssl;
        break;
      case ServerTypes.sauce:
        path = '/wd/hub';
        host = `ondemand.${session.server.sauce.dataCenter}.saucelabs.com`;
        port = 80;
        if (session.server.sauce.useSCProxy) {
          host = session.server.sauce.scHost || 'localhost';
          port = parseInt(session.server.sauce.scPort, 10) || 4445;
        }
        username = session.server.sauce.username || process.env.SAUCE_USERNAME;
        accessKey = session.server.sauce.accessKey || process.env.SAUCE_ACCESS_KEY;
        if (!username || !accessKey) {
          notification.error({
            message: i18n.t('Error'),
            description: i18n.t('sauceCredentialsRequired'),
            duration: 4
          });
          return;
        }
        https = false;
        if (!isPlainObject(desiredCapabilities[SAUCE_OPTIONS_CAP])) {
          desiredCapabilities[SAUCE_OPTIONS_CAP] = {};
        }
        if (!desiredCapabilities[SAUCE_OPTIONS_CAP].name) {
          const dateTime = moment().format('lll');
          desiredCapabilities[SAUCE_OPTIONS_CAP].name = `Appium Desktop Session -- ${dateTime}`;
        }
        break;
      case ServerTypes.headspin: {
        let headspinUrl;
        try {
          headspinUrl = new URL(session.server.headspin.webDriverUrl);
        } catch (ign) {
          showError(new Error(`${session.server.headspin.webDriverUrl} is invalid url`), null, 0);
          return;
        }
        host = session.server.headspin.hostname = headspinUrl.hostname;
        path = session.server.headspin.path = headspinUrl.pathname;
        https = session.server.headspin.ssl = headspinUrl.protocol === 'https:';
        // new URL() does not have the port of 443 when `https` and 80 when `http`
        port = session.server.headspin.port = headspinUrl.port === '' ? (https ? 443 : 80) : headspinUrl.port;
        break;
      }
      case ServerTypes.perfecto:
        host = session.server.perfecto.hostname;
        port = session.server.perfecto.port || (session.server.perfecto.ssl ? 443 : 80);
        token = session.server.perfecto.token || process.env.PERFECTO_TOKEN;
        path = session.server.perfecto.path = '/nexperience/perfectomobile/wd/hub';
        if (!token) {
          notification.error({
            message: i18n.t('Error'),
            description: i18n.t('Perfecto SecurityToken is required'),
            duration: 4
          });
          return;
        }
        desiredCapabilities['perfecto:options'] = {securityToken: token};
        https = session.server.perfecto.ssl;
        break;
      case ServerTypes.browserstack:
        host = session.server.browserstack.hostname = process.env.BROWSERSTACK_HOST || 'hub-cloud.browserstack.com';
        port = session.server.browserstack.port = process.env.BROWSERSTACK_PORT || 443;
        path = session.server.browserstack.path = '/wd/hub';
        username = session.server.browserstack.username || process.env.BROWSERSTACK_USERNAME;
        desiredCapabilities['bstack:options'] = {};
        desiredCapabilities['bstack:options'].source = 'appiumdesktop';
        accessKey = session.server.browserstack.accessKey || process.env.BROWSERSTACK_ACCESS_KEY;
        if (!username || !accessKey) {
          notification.error({
            message: i18n.t('Error'),
            description: i18n.t('browserstackCredentialsRequired'),
            duration: 4
          });
          return;
        }
        https = session.server.browserstack.ssl = (parseInt(port, 10) === 443);
        break;
      case ServerTypes.lambdatest:
        host = session.server.lambdatest.hostname = process.env.LAMBDATEST_HOST || 'mobile-hub.lambdatest.com';
        port = session.server.lambdatest.port = process.env.LAMBDATEST_PORT || 443;
        path = session.server.lambdatest.path = '/wd/hub';
        isProxyChecked = session.server.advanced.useProxy;
        username = session.server.lambdatest.username || process.env.LAMBDATEST_USERNAME;
        if (desiredCapabilities.hasOwnProperty.call(desiredCapabilities, 'lt:options')) {
          desiredCapabilities['lt:options'].source = 'appiumdesktop';
          desiredCapabilities['lt:options'].isRealMobile = true;
          if (isProxyChecked) {
            if (session.server.advanced.proxy === undefined) {
              desiredCapabilities['lt:options'].proxyUrl = '';
            } else {
              desiredCapabilities['lt:options'].proxyUrl = `${session.server.advanced.proxy}`;
            }
          }
        } else {
          desiredCapabilities['lambdatest:source'] = 'appiumdesktop';
          desiredCapabilities['lambdatest:isRealMobile'] = true;
          if (isProxyChecked) {
            if (session.server.advanced.proxy === undefined) {
              desiredCapabilities['lambdatest:proxyUrl'] = '';
            } else {
              desiredCapabilities['lambdatest:proxyUrl'] = `${session.server.advanced.proxy}`;
            }
          }
        }
        accessKey = session.server.lambdatest.accessKey || process.env.LAMBDATEST_ACCESS_KEY;
        if (!username || !accessKey) {
          notification.error({
            message: i18n.t('Error'),
            description: i18n.t('lambdatestCredentialsRequired'),
            duration: 4,
          });
          return;
        }
        https = session.server.lambdatest.ssl = parseInt(port, 10) === 443;
        break;
      case ServerTypes.bitbar:
        host = process.env.BITBAR_HOST || 'appium.bitbar.com';
        port = session.server.bitbar.port = 443;
        path = session.server.bitbar.path = '/wd/hub';
        accessKey = session.server.bitbar.apiKey || process.env.BITBAR_API_KEY;
        if (!accessKey) {
          notification.error({
            message: i18n.t('Error'),
            description: i18n.t('bitbarCredentialsRequired'),
            duration: 4
          });
          return;
        }
        desiredCapabilities.testdroid_source = 'appiumdesktop';
        desiredCapabilities.testdroid_apiKey = accessKey;
        https = session.server.bitbar.ssl = true;
        break;
      case ServerTypes.kobiton:
        host = process.env.KOBITON_HOST || 'api.kobiton.com';
        port = session.server.kobiton.port = 443;
        path = session.server.kobiton.path = '/wd/hub';
        username = session.server.kobiton.username || process.env.KOBITON_USERNAME;
        accessKey = session.server.kobiton.accessKey || process.env.KOBITON_ACCESS_KEY;
        desiredCapabilities['kobiton:options'] = {};
        desiredCapabilities['kobiton:options'].source = 'appiumdesktop';
        if (!username || !accessKey) {
          notification.error({
            message: i18n.t('Error'),
            description: i18n.t('kobitonCredentialsRequired'),
            duration: 4
          });
          return;
        }
        https = session.server.kobiton.ssl = true;
        break;
      case ServerTypes.pcloudy:
        host = session.server.pcloudy.hostname;
        port = session.server.pcloudy.port = 443;
        path = session.server.pcloudy.path = '/objectspy/wd/hub';
        desiredCapabilities.pCloudy_Username = session.server.pcloudy.username || process.env.PCLOUDY_USERNAME;
        desiredCapabilities.pCloudy_ApiKey = session.server.pcloudy.accessKey || process.env.PCLOUDY_ACCESS_KEY;
        if (!(session.server.pcloudy.username || process.env.PCLOUDY_USERNAME) ||
              !(session.server.pcloudy.accessKey || process.env.PCLOUDY_ACCESS_KEY)) {
          notification.error({
            message: 'Error',
            description: 'PCLOUDY username and api key are required!',
            duration: 4
          });
          return;
        }
        https = session.server.pcloudy.ssl = true;
        break;
      case ServerTypes.testingbot:
        host = session.server.testingbot.hostname = process.env.TB_HOST || 'hub.testingbot.com';
        port = session.server.testingbot.port = 443;
        path = session.server.testingbot.path = '/wd/hub';
        desiredCapabilities['tb:options'] = {};
        desiredCapabilities['tb:options'].key = session.server.testingbot.key || process.env.TB_KEY;
        desiredCapabilities['tb:options'].secret = session.server.testingbot.secret || process.env.TB_SECRET;
        if (!(session.server.testingbot.key || process.env.TB_KEY) ||
              !(session.server.testingbot.secret || process.env.TB_SECRET)) {
          notification.error({
            message: 'Error',
            description: i18n.t('testingbotCredentialsRequired'),
            duration: 4
          });
          return;
        }
        https = session.server.testingbot.ssl = true;
        break;
      case ServerTypes.experitest: {
        if (!session.server.experitest.url || !session.server.experitest.accessKey) {
          notification.error({
            message: i18n.t('Error'),
            description: i18n.t('experitestAccessKeyURLRequired'),
            duration: 4
          });
          return;
        }
        desiredCapabilities['experitest:accessKey'] = session.server.experitest.accessKey;

        let experitestUrl;
        try {
          experitestUrl = new URL(session.server.experitest.url);
        } catch (ign) {
          showError(new Error(`${session.server.experitest.url} is invalid url`), null, 0);
          return;
        }

        host = session.server.experitest.hostname = experitestUrl.hostname;
        path = session.server.experitest.path = '/wd/hub';
        https = session.server.experitest.ssl = experitestUrl.protocol === 'https:';
        port = session.server.experitest.port = experitestUrl.port === '' ? (https ? 443 : 80) : experitestUrl.port;
        break;
      } case ServerTypes.roboticmobi: {
        host = 'api.robotic.mobi';
        path = '/wd/hub';
        port = 443;
        https = session.server.roboticmobi.ssl = true;
        if (caps) {
          desiredCapabilities['roboticmobi:options'] = {};
          desiredCapabilities['roboticmobi:options'].robotic_mobi_token = session.server.roboticmobi.token || process.env.ROBOTIC_MOBI_TOKEN;
        }
        break;
      }

      default:
        break;
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

    dispatch({type: SESSION_LOADING});


    const serverOpts = {
      hostname: host,
      port: parseInt(port, 10),
      protocol: https ? 'https' : 'http',
      path,
      connectionRetryCount: CONN_RETRIES,
    };

    if (username && accessKey) {
      serverOpts.user = username;
      serverOpts.key = accessKey;
    }

    // If a newCommandTimeout wasn't provided, set it to 60 * 60 so that sessions don't close on users in short term.
    // I saw sometimes infinit session timeout was not so good for cloud providers.
    // So, let me define this value as NEW_COMMAND_TIMEOUT_SEC by default.
    if (isUndefined(desiredCapabilities[CAPS_NEW_COMMAND])) {
      desiredCapabilities[CAPS_NEW_COMMAND] = NEW_COMMAND_TIMEOUT_SEC;
    }

    // If someone didn't specify connectHardwareKeyboard, set it to true by
    // default
    if (isUndefined(desiredCapabilities[CAPS_CONNECT_HARDWARE_KEYBOARD])) {
      desiredCapabilities[CAPS_CONNECT_HARDWARE_KEYBOARD] = true;
    }

    serverOpts.logLevel = process.env.NODE_ENV === 'development' ? 'info' : 'warn';

    let driver = null;
    try {
      if (attachSessId) {
        // When attaching to a session id, webdriver does not check if the device
        // is mobile or not. Since we're attaching in appium-inspector, we can
        // assume the device is mobile so that Appium protocols are included
        // in the userPrototype.
        serverOpts.isMobile = true;
        // Need to set connectionRetryTimeout as same as the new session request.
        // TODO: make configurable?
        serverOpts.connectionRetryTimeout = 120000;
        driver = await Web2Driver.attachToSession(attachSessId, serverOpts);
        driver._isAttachedSession = true;
      } else {
        driver = await Web2Driver.remote(serverOpts, desiredCapabilities);
      }
    } catch (err) {
      showError(err, null, 0);
      return;
    } finally {
      dispatch({type: SESSION_LOADING_DONE});
      // Save the current server settings
      await setSetting(SESSION_SERVER_PARAMS, session.server);
    }

    // The homepage arg in ChromeDriver is not working with Appium. iOS can have a default url, but
    // we want to keep the process equal to prevent complexity so we launch a default url here to make
    // sure we don't start with an empty page which will not show proper HTML in the inspector
    const {browserName = ''} = desiredCapabilities;

    if (browserName.trim() !== '') {
      try {
        await driver.navigateTo('http://appium.io/docs/en/about-appium/intro/');
      } catch (ign) {}
    }

    // pass some state to the inspector that it needs to build recorder
    // code boilerplate
    const action = setSessionDetails(driver, {
      desiredCapabilities,
      host,
      port,
      path,
      username,
      accessKey,
      https,
    });
    action(dispatch);
    dispatch(push('/inspector'));
  };
}


/**
 * Saves the caps
 */
export function saveSession (caps, params) {
  return async (dispatch) => {
    let {name, uuid} = params;
    dispatch({type: SAVE_SESSION_REQUESTED});
    let savedSessions = await getSetting(SAVED_SESSIONS);
    if (!uuid) {

      // If it's a new session, add it to the list
      uuid = UUID();
      let newSavedSession = {
        date: Date.now(),
        name,
        uuid,
        caps,
      };
      savedSessions.push(newSavedSession);
    } else {

      // If it's an existing session, overwrite it
      for (let session of savedSessions) {
        if (session.uuid === uuid) {
          session.caps = caps;
        }
      }
    }
    await setSetting(SAVED_SESSIONS, savedSessions);
    const action = getSavedSessions();
    await action(dispatch);
    dispatch({type: SET_CAPS, caps, uuid});
    dispatch({type: SAVE_SESSION_DONE});
  };
}

/**
 * Get the sessions saved by the user
 */
export function getSavedSessions () {
  return async (dispatch) => {
    dispatch({type: GET_SAVED_SESSIONS_REQUESTED});
    let savedSessions = await getSetting(SAVED_SESSIONS);
    dispatch({type: GET_SAVED_SESSIONS_DONE, savedSessions});
  };
}

/**
 * Switch to a different tab
 */
export function switchTabs (key) {
  return (dispatch) => {
    dispatch({type: SWITCHED_TABS, key});
  };
}

/**
 * Open a 'Save As' modal
 */
export function requestSaveAsModal () {
  return (dispatch) => {
    dispatch({type: SAVE_AS_MODAL_REQUESTED});
  };
}

/**
 * Hide the 'Save As' modal
 */
export function hideSaveAsModal () {
  return (dispatch) => {
    dispatch({type: HIDE_SAVE_AS_MODAL_REQUESTED});
  };
}

/**
 * Set the text to save capabilities as
 */
export function setSaveAsText (saveAsText) {
  return (dispatch) => {
    dispatch({type: SET_SAVE_AS_TEXT, saveAsText});
  };
}

/**
 * Delete a saved session
 */
export function deleteSavedSession (uuid) {
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
export function setAttachSessId (attachSessId) {
  return (dispatch) => {
    dispatch({type: SET_ATTACH_SESS_ID, attachSessId});
  };
}

/**
 * Change the server type
 */
export function changeServerType (serverType) {
  return async (dispatch, getState) => {
    await setSetting(SESSION_SERVER_TYPE, serverType);
    dispatch({type: CHANGE_SERVER_TYPE, serverType});
    const action = getRunningSessions();
    action(dispatch, getState);
  };
}

/**
 * Set a server parameter (host, port, etc...)
 */
export function setServerParam (name, value, serverType) {
  const debounceGetRunningSessions = debounce(getRunningSessions(), 5000);
  return async (dispatch, getState) => {
    serverType = serverType || getState().session.serverType;
    await setSetting(SESSION_SERVER_TYPE, serverType);
    dispatch({type: SET_SERVER_PARAM, serverType, name, value});
    debounceGetRunningSessions(dispatch, getState);
  };
}

/**
 * Set the local server hostname and port to whatever was saved in 'actions/StartServer.js' so that it
 * defaults to what the currently running appium server is
 */
export function setLocalServerParams () {
  return async (dispatch, getState) => {
    let serverArgs = await getSetting(SERVER_ARGS);
    // Get saved server args from settings and set local server settings to it. If there are no saved args, set local
    // host and port to undefined
    if (serverArgs) {
      dispatch({type: SET_SERVER_PARAM, serverType: ServerTypes.local, name: 'port', value: serverArgs.port});
      dispatch({type: SET_SERVER_PARAM, serverType: ServerTypes.local, name: 'hostname', value: 'localhost'});
    } else {
      dispatch({type: SET_SERVER_PARAM, serverType: ServerTypes.local, name: 'port', value: undefined});
      dispatch({type: SET_SERVER_PARAM, serverType: ServerTypes.local, name: 'hostname', value: undefined});
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
export function setSavedServerParams () {
  return async (dispatch, getState) => {
    let server = await getSetting(SESSION_SERVER_PARAMS);
    let serverType = await getSetting(SESSION_SERVER_TYPE);
    let currentProviders = getState().session.visibleProviders;

    if (server) {
      // if we have a cloud provider as a saved server, but for some reason the
      // cloud provider is no longer in the list, revert server type to remote
      if (keys(CloudProviders).includes(serverType) &&
          !currentProviders.includes(serverType)) {
        serverType = ServerTypes.remote;
      }
      dispatch({type: SET_SERVER, server, serverType});
    }
  };
}

export function getRunningSessions () {
  return async (dispatch, getState) => {
    const avoidServerTypes = [
      'sauce'
    ];
    // Get currently running sessions for this server
    const state = getState().session;
    const {server, serverType} = state;
    const serverInfo = server[serverType];
    let {hostname, port, path, ssl, username, accessKey} = serverInfo;

    // if we have a standard remote server, fill out connection info based on placeholder defaults
    // in case the user hasn't adjusted those fields
    if (serverType === ServerTypes.remote) {
      hostname = hostname || DEFAULT_SERVER_HOST;
      port = port || DEFAULT_SERVER_PORT;
      path = path || DEFAULT_SERVER_PATH;
    }

    if (!hostname || !port || !path) {
      // no need to get sessions if we don't have complete server info
      return;
    }

    dispatch({type: GET_SESSIONS_REQUESTED});
    if (avoidServerTypes.includes(serverType)) {
      dispatch({type: GET_SESSIONS_DONE});
      return;
    }

    try {
      const adjPath = path.endsWith('/') ? path : `${path}/`;
      const res = username && accessKey
        ? await ky(`http${ssl ? 's' : ''}://${hostname}:${port}${adjPath}sessions`, {
          headers: {'Authorization': `Basic ${btoa(`${username}:${accessKey}`)}`}
        }).json()
        : await ky(`http${ssl ? 's' : ''}://${hostname}:${port}${adjPath}sessions`).json();
      dispatch({type: GET_SESSIONS_DONE, sessions: res.value});
    } catch (err) {
      console.warn(`Ignoring error in getting list of active sessions: ${err}`); // eslint-disable-line no-console
      dispatch({type: GET_SESSIONS_DONE});
    }
  };
}

export function startDesiredCapsEditor () {
  return (dispatch) => {
    dispatch({type: ENABLE_DESIRED_CAPS_EDITOR});
  };
}

export function abortDesiredCapsEditor () {
  return (dispatch) => {
    dispatch({type: ABORT_DESIRED_CAPS_EDITOR});
  };
}

export function saveRawDesiredCaps () {
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
      let newCapsArray = toPairs(newCaps).map(([name, value]) => ({
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

export function setRawDesiredCaps (rawDesiredCaps) {
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

export function addCloudProvider () {
  return (dispatch) => {
    dispatch({type: IS_ADDING_CLOUD_PROVIDER, isAddingProvider: true});
  };
}

export function stopAddCloudProvider () {
  return (dispatch) => {
    dispatch({type: IS_ADDING_CLOUD_PROVIDER, isAddingProvider: false});
  };
}

export function addVisibleProvider (provider) {
  return async (dispatch, getState) => {
    let currentProviders = getState().session.visibleProviders;
    const providers = union(currentProviders, [provider]);
    await setSetting(VISIBLE_PROVIDERS, providers);
    dispatch({type: SET_PROVIDERS, providers});
  };
}

export function removeVisibleProvider (provider) {
  return async (dispatch, getState) => {
    let currentProviders = getState().session.visibleProviders;
    const providers = without(currentProviders, provider);
    await setSetting(VISIBLE_PROVIDERS, providers);
    dispatch({type: SET_PROVIDERS, providers});
  };
}

export function setVisibleProviders () {
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
function addCustomCaps (caps) {
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

export function bindWindowClose () {
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

export function setAddVendorPrefixes (addVendorPrefixes) {
  return (dispatch) => {
    dispatch({type: SET_ADD_VENDOR_PREFIXES, addVendorPrefixes});
  };
}

export function initFromQueryString () {
  return async (dispatch, getState) => {
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
      } catch (e) {
        showError(new Error('Could not parse initial state from URL'), null, 0);
      }
    }

    if (autoStartSession === AUTO_START_URL_PARAM) {
      const {attachSessId, caps} = getState().session;
      if (attachSessId) {
        return await newSession(null, attachSessId)(dispatch, getState);
      }
      await newSession(caps)(dispatch, getState);
    }
  };
}