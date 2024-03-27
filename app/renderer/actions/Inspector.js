import _ from 'lodash';
import {v4 as UUID} from 'uuid';

import i18n from '../../configs/i18next.config.renderer';
import {SAVED_FRAMEWORK, SET_SAVED_GESTURES, getSetting, setSetting} from '../../shared/settings';
import {APP_MODE, NATIVE_APP} from '../constants/session-inspector';
import AppiumClient from '../lib/appium-client';
import frameworks from '../lib/client-frameworks';
import {getOptimalXPath, getSuggestedLocators} from '../utils/locator-generation';
import {
  domParser,
  findDOMNodeByPath,
  findJSONElementByPath,
  xmlToJSON,
} from '../utils/source-parsing';
import {showError} from './Session';

export const SET_SESSION_DETAILS = 'SET_SESSION_DETAILS';
export const SET_SOURCE_AND_SCREENSHOT = 'SET_SOURCE_AND_SCREENSHOT';
export const SESSION_DONE = 'SESSION_DONE';
export const SELECT_ELEMENT = 'SELECT_ELEMENT';
export const UNSELECT_ELEMENT = 'UNSELECT_ELEMENT';
export const SET_SELECTED_ELEMENT_ID = 'SET_SELECTED_ELEMENT_ID';
export const SET_INTERACTIONS_NOT_AVAILABLE = 'SET_INTERACTIONS_NOT_AVAILABLE';
export const METHOD_CALL_REQUESTED = 'METHOD_CALL_REQUESTED';
export const METHOD_CALL_DONE = 'METHOD_CALL_DONE';
export const SET_EXPANDED_PATHS = 'SET_EXPANDED_PATHS';
export const SET_OPTIMAL_LOCATORS = 'SET_OPTIMAL_LOCATORS';
export const SELECT_HOVERED_ELEMENT = 'SELECT_HOVERED_ELEMENT';
export const UNSELECT_HOVERED_ELEMENT = 'UNSELECT_HOVERED_ELEMENT';

export const SELECT_HOVERED_CENTROID = 'SELECT_HOVERED_CENTROID';
export const UNSELECT_HOVERED_CENTROID = 'UNSELECT_HOVERED_CENTROID';
export const SELECT_CENTROID = 'SELECT_CENTROID';
export const UNSELECT_CENTROID = 'UNSELECT_CENTROID';
export const SET_SHOW_CENTROIDS = 'SET_SHOW_CENTROIDS';

export const QUIT_SESSION_REQUESTED = 'QUIT_SESSION_REQUESTED';
export const QUIT_SESSION_DONE = 'QUIT_SESSION_DONE';
export const SET_SESSION_TIME = 'SET_SESSION_TIME';

export const START_RECORDING = 'START_RECORDING';
export const PAUSE_RECORDING = 'PAUSE_RECORDING';
export const CLEAR_RECORDING = 'CLEAR_RECORDING';
export const SET_ACTION_FRAMEWORK = 'SET_ACTION_FRAMEWORK';
export const RECORD_ACTION = 'RECORD_ACTION';
export const SET_SHOW_BOILERPLATE = 'SET_SHOW_BOILERPLATE';

export const SHOW_LOCATOR_TEST_MODAL = 'SHOW_LOCATOR_TEST_MODAL';
export const HIDE_LOCATOR_TEST_MODAL = 'HIDE_LOCATOR_TEST_MODAL';
export const SHOW_SIRI_COMMAND_MODAL = 'SHOW_SIRI_COMMAND_MODAL';
export const HIDE_SIRI_COMMAND_MODAL = 'HIDE_SIRI_COMMAND_MODAL';
export const SET_SIRI_COMMAND_VALUE = 'SET_SIRI_COMMAND_VALUE';
export const SET_LOCATOR_TEST_STRATEGY = 'SET_LOCATOR_TEST_STRATEGY';
export const SET_LOCATOR_TEST_VALUE = 'SET_LOCATOR_TEST_VALUE';
export const SEARCHING_FOR_ELEMENTS = 'SEARCHING_FOR_ELEMENTS';
export const SEARCHING_FOR_ELEMENTS_COMPLETED = 'SEARCHING_FOR_ELEMENTS_COMPLETED';
export const GET_FIND_ELEMENTS_TIMES = 'GET_FIND_ELEMENTS_TIMES';
export const GET_FIND_ELEMENTS_TIMES_COMPLETED = 'GET_FIND_ELEMENTS_TIMES_COMPLETED';
export const SET_LOCATOR_TEST_ELEMENT = 'SET_LOCATOR_TEST_ELEMENT';
export const FINDING_ELEMENT_IN_SOURCE = 'FINDING_ELEMENT_IN_SOURCE';
export const FINDING_ELEMENT_IN_SOURCE_COMPLETED = 'FINDING_ELEMENT_IN_SOURCE_COMPLETED';
export const CLEAR_SEARCH_RESULTS = 'CLEAR_SEARCH_RESULTS';
export const ADD_ASSIGNED_VAR_CACHE = 'ADD_ASSIGNED_VAR_CACHE';
export const CLEAR_ASSIGNED_VAR_CACHE = 'CLEAR_ASSIGNED_VAR_CACHE';
export const SET_SCREENSHOT_INTERACTION_MODE = 'SET_SCREENSHOT_INTERACTION_MODE';
export const SET_APP_MODE = 'SET_APP_MODE';
export const SET_SEARCHED_FOR_ELEMENT_BOUNDS = 'SET_SEARCHED_FOR_ELEMENT_BOUNDS';
export const CLEAR_SEARCHED_FOR_ELEMENT_BOUNDS = 'CLEAR_SEARCHED_FOR_ELEMENT_BOUNDS';

export const SET_COORD_START = 'SET_COORD_START';
export const SET_COORD_END = 'SET_COORD_END';
export const CLEAR_COORD_ACTION = 'CLEAR_COORD_ACTION';
export const PROMPT_KEEP_ALIVE = 'PROMPT_KEEP_ALIVE';
export const HIDE_PROMPT_KEEP_ALIVE = 'HIDE_PROMPT_KEEP_ALIVE';

export const SELECT_INSPECTOR_TAB = 'SELECT_INSPECTOR_TAB';

export const ENTERING_COMMAND_ARGS = 'ENTERING_COMMAND_ARGS';
export const CANCEL_PENDING_COMMAND = 'CANCEL_PENDING_COMMAND';
export const SET_COMMAND_ARG = 'SET_COMMAND_ARG';

export const SET_CONTEXT = 'SET_CONTEXT';

export const SET_APP_ID = 'SET_APP_ID';
export const SET_SERVER_STATUS = 'SET_SERVER_STATUS';

export const SET_KEEP_ALIVE_INTERVAL = 'SET_KEEP_ALIVE_INTERVAL';
export const SET_USER_WAIT_TIMEOUT = 'SET_USER_WAIT_TIMEOUT';
export const SET_LAST_ACTIVE_MOMENT = 'SET_LAST_ACTIVE_MOMENT';

export const SET_VISIBLE_COMMAND_RESULT = 'SET_VISIBLE_COMMAND_RESULT';

export const SET_AWAITING_MJPEG_STREAM = 'SET_AWAITING_MJPEG_STREAM';

export const SHOW_GESTURE_EDITOR = 'SHOW_GESTURE_EDITOR';
export const HIDE_GESTURE_EDITOR = 'HIDE_GESTURE_EDITOR';
export const GET_SAVED_GESTURES_REQUESTED = 'GET_SAVED_GESTURES_REQUESTED';
export const GET_SAVED_GESTURES_DONE = 'GET_SAVED_GESTURES_DONE';
export const DELETE_SAVED_GESTURES_REQUESTED = 'DELETE_SAVED_GESTURES_REQUESTED';
export const DELETE_SAVED_GESTURES_DONE = 'DELETE_SAVED_GESTURES_DONE';
export const SET_LOADED_GESTURE = 'SET_LOADED_GESTURE';
export const REMOVE_LOADED_GESTURE = 'REMOVE_LOADED_GESTURE';
export const SHOW_GESTURE_ACTION = 'SHOW_GESTURE_ACTION';
export const HIDE_GESTURE_ACTION = 'HIDE_GESTURE_ACTION';
export const SELECT_TICK_ELEMENT = 'SELECT_TICK_ELEMENT';
export const UNSELECT_TICK_ELEMENT = 'UNSELECT_TICK_ELEMENT';
export const SET_GESTURE_TAP_COORDS_MODE = 'SET_GESTURE_TAP_COORDS_MODE';
export const CLEAR_TAP_COORDINATES = 'CLEAR_TAP_COORDINATES';

export const TOGGLE_SHOW_ATTRIBUTES = 'TOGGLE_SHOW_ATTRIBUTES';
export const TOGGLE_REFRESHING_STATE = 'TOGGLE_REFRESHING_STATE';

const KEEP_ALIVE_PING_INTERVAL = 20 * 1000;
const NO_NEW_COMMAND_LIMIT = 24 * 60 * 60 * 1000; // Set timeout to 24 hours

// A debounced function that calls findElement and gets info about the element
const findElement = _.debounce(async function (strategyMap, dispatch, getState, path) {
  for (let [strategy, selector] of strategyMap) {
    // Get the information about the element
    const action = callClientMethod({
      strategy,
      selector,
    });
    let {elementId} = await action(dispatch, getState);

    // Set the elementId for the selected element
    // (check first that the selectedElementPath didn't change, to avoid race conditions)
    if (elementId && getState().inspector.selectedElementPath === path) {
      return dispatch({type: SET_SELECTED_ELEMENT_ID, elementId});
    }
  }

  return dispatch({type: SET_INTERACTIONS_NOT_AVAILABLE});
}, 1000);

export function selectElement(path) {
  return async (dispatch, getState) => {
    const {sourceJSON, sourceXML, expandedPaths, currentContext, automationName} =
      getState().inspector;
    const isNative = currentContext === NATIVE_APP;
    // Set the selected element in the source tree
    const selectedElement = findJSONElementByPath(path, sourceJSON);
    dispatch({type: SELECT_ELEMENT, selectedElement});

    // Expand all of this element's ancestors so that it's visible in the source tree
    // Make a copy of the array to avoid state mutation
    const copiedExpandedPaths = [...expandedPaths];
    let pathArr = path.split('.').slice(0, path.length - 1);
    while (pathArr.length > 1) {
      pathArr.splice(pathArr.length - 1);
      let path = pathArr.join('.');
      if (!copiedExpandedPaths.includes(path)) {
        copiedExpandedPaths.push(path);
      }
    }
    dispatch({type: SET_EXPANDED_PATHS, paths: copiedExpandedPaths});

    // Calculate the recommended locator strategies
    const strategyMap = getSuggestedLocators(selectedElement, sourceXML, isNative, automationName);
    dispatch({type: SET_OPTIMAL_LOCATORS, strategyMap});

    // Debounce find element so that if another element is selected shortly after, cancel the previous search
    await findElement(strategyMap, dispatch, getState, path);
  };
}

export function unselectElement() {
  return (dispatch) => {
    dispatch({type: UNSELECT_ELEMENT});
  };
}

export function selectCentroid(path) {
  return (dispatch) => {
    dispatch({type: SELECT_CENTROID, path});
  };
}

export function unselectCentroid() {
  return (dispatch) => {
    dispatch({type: UNSELECT_CENTROID});
  };
}

export function selectHoveredCentroid(path) {
  return (dispatch) => {
    dispatch({type: SELECT_HOVERED_CENTROID, path});
  };
}

export function unselectHoveredCentroid() {
  return (dispatch) => {
    dispatch({type: UNSELECT_HOVERED_CENTROID});
  };
}

export function selectHoveredElement(path) {
  return (dispatch, getState) => {
    const {sourceJSON} = getState().inspector;
    const hoveredElement = findJSONElementByPath(path, sourceJSON);
    dispatch({type: SELECT_HOVERED_ELEMENT, hoveredElement});
  };
}

export function unselectHoveredElement() {
  return (dispatch) => {
    dispatch({type: UNSELECT_HOVERED_ELEMENT});
  };
}

/**
 * Requests a method call on appium
 */
export function applyClientMethod(params) {
  return async (dispatch, getState) => {
    const isRecording =
      params.methodName !== 'quit' &&
      params.methodName !== 'getPageSource' &&
      params.methodName !== 'gesture' &&
      params.methodName !== 'status' &&
      getState().inspector.isRecording;
    try {
      dispatch({type: METHOD_CALL_REQUESTED});
      const callAction = callClientMethod(params);
      const {
        contexts,
        contextsError,
        commandRes,
        currentContext,
        currentContextError,
        source,
        screenshot,
        windowSize,
        sourceError,
        screenshotError,
        windowSizeError,
        variableName,
        variableIndex,
        strategy,
        selector,
      } = await callAction(dispatch, getState);

      // TODO: Implement recorder code for gestures
      if (isRecording) {
        // Add 'findAndAssign' line of code. Don't do it for arrays though. Arrays already have 'find' expression
        if (strategy && selector && !variableIndex && variableIndex !== 0) {
          const findAction = findAndAssign(strategy, selector, variableName, false);
          findAction(dispatch, getState);
        }

        // now record the actual action
        let args = [variableName, variableIndex];
        args = args.concat(params.args || []);
        dispatch({type: RECORD_ACTION, action: params.methodName, params: args});
      }
      dispatch({type: METHOD_CALL_DONE});

      if (source) {
        dispatch({
          type: SET_SOURCE_AND_SCREENSHOT,
          contexts,
          currentContext,
          sourceJSON: xmlToJSON(source),
          sourceXML: source,
          screenshot,
          windowSize,
          contextsError,
          currentContextError,
          sourceError,
          screenshotError,
          windowSizeError,
        });
      }
      window.dispatchEvent(new Event('resize'));
      return commandRes;
    } catch (error) {
      console.log(error); // eslint-disable-line no-console
      let methodName = params.methodName === 'click' ? 'tap' : params.methodName;
      showError(error, {methodName, secs: 10});
      dispatch({type: METHOD_CALL_DONE});
    }
  };
}

export function addAssignedVarCache(varName) {
  return (dispatch) => {
    dispatch({type: ADD_ASSIGNED_VAR_CACHE, varName});
  };
}

export function setExpandedPaths(paths) {
  return (dispatch) => {
    dispatch({type: SET_EXPANDED_PATHS, paths});
  };
}

/**
 * Quit the session and go back to the new session window
 */
export function quitSession(reason, killedByUser = true) {
  return async (dispatch, getState) => {
    const killAction = killKeepAliveLoop();
    killAction(dispatch, getState);
    const applyAction = applyClientMethod({methodName: 'quit'});
    await applyAction(dispatch, getState);
    dispatch({type: QUIT_SESSION_DONE});
    if (!killedByUser) {
      showError(new Error(reason || i18n.t('Session has been terminated')), {secs: 0});
    }
  };
}

export function startRecording() {
  return (dispatch) => {
    dispatch({type: START_RECORDING});
  };
}

export function pauseRecording() {
  return (dispatch) => {
    dispatch({type: PAUSE_RECORDING});
  };
}

export function clearRecording() {
  return (dispatch) => {
    dispatch({type: CLEAR_RECORDING});
    dispatch({type: CLEAR_ASSIGNED_VAR_CACHE}); // Get rid of the variable cache
  };
}

export function getSavedActionFramework() {
  return async (dispatch) => {
    let framework = await getSetting(SAVED_FRAMEWORK);
    dispatch({type: SET_ACTION_FRAMEWORK, framework});
  };
}

export function setActionFramework(framework) {
  return async (dispatch) => {
    if (!frameworks[framework]) {
      throw new Error(i18n.t('frameworkNotSupported', {framework}));
    }
    await setSetting(SAVED_FRAMEWORK, framework);
    dispatch({type: SET_ACTION_FRAMEWORK, framework});
  };
}

export function recordAction(action, params) {
  return (dispatch) => {
    dispatch({type: RECORD_ACTION, action, params});
  };
}

export function toggleShowBoilerplate() {
  return (dispatch, getState) => {
    const show = !getState().inspector.showBoilerplate;
    dispatch({type: SET_SHOW_BOILERPLATE, show});
  };
}

export function setSessionDetails({driver, sessionDetails, mode, mjpegScreenshotUrl}) {
  return (dispatch) => {
    dispatch({type: SET_SESSION_DETAILS, driver, sessionDetails, mode, mjpegScreenshotUrl});
  };
}

export function showLocatorTestModal() {
  return (dispatch) => {
    dispatch({type: SHOW_LOCATOR_TEST_MODAL});
  };
}

export function hideLocatorTestModal() {
  return (dispatch) => {
    dispatch({type: HIDE_LOCATOR_TEST_MODAL});
  };
}

export function showSiriCommandModal() {
  return (dispatch) => {
    dispatch({type: SHOW_SIRI_COMMAND_MODAL});
  };
}

export function hideSiriCommandModal() {
  return (dispatch) => {
    dispatch({type: HIDE_SIRI_COMMAND_MODAL});
  };
}

export function setSiriCommandValue(siriCommandValue) {
  return (dispatch) => {
    dispatch({type: SET_SIRI_COMMAND_VALUE, siriCommandValue});
  };
}

export function setLocatorTestValue(locatorTestValue) {
  return (dispatch) => {
    dispatch({type: SET_LOCATOR_TEST_VALUE, locatorTestValue});
  };
}

export function setLocatorTestStrategy(locatorTestStrategy) {
  return (dispatch) => {
    dispatch({type: SET_LOCATOR_TEST_STRATEGY, locatorTestStrategy});
  };
}

export function setContext(context) {
  return (dispatch) => {
    dispatch({type: SET_CONTEXT, context});
  };
}

export function searchForElement(strategy, selector) {
  return async (dispatch, getState) => {
    dispatch({type: SEARCHING_FOR_ELEMENTS});
    try {
      const callAction = callClientMethod({strategy, selector, fetchArray: true});
      let {elements, variableName, executionTime} = await callAction(dispatch, getState);
      const findAction = findAndAssign(strategy, selector, variableName, true);
      findAction(dispatch, getState);
      elements = elements.map((el) => el.id);
      dispatch({type: SEARCHING_FOR_ELEMENTS_COMPLETED, elements, executionTime});
    } catch (error) {
      dispatch({type: SEARCHING_FOR_ELEMENTS_COMPLETED});
      showError(error, {methodName: 10});
    }
  };
}

/**
 * Get all the find element times based on the find data source
 */
export function getFindElementsTimes(findDataSource) {
  return async (dispatch, getState) => {
    dispatch({type: GET_FIND_ELEMENTS_TIMES});
    try {
      const findElementsExecutionTimes = [];
      for (const element of findDataSource) {
        const {find, key, selector} = element;
        const action = callClientMethod({strategy: key, selector});
        const {executionTime} = await action(dispatch, getState);
        findElementsExecutionTimes.push({find, key, selector, time: executionTime});
      }

      dispatch({
        type: GET_FIND_ELEMENTS_TIMES_COMPLETED,
        findElementsExecutionTimes: _.sortBy(findElementsExecutionTimes, ['time']),
      });
    } catch (error) {
      dispatch({type: GET_FIND_ELEMENTS_TIMES_COMPLETED});
      showError(error, {methodName: 10});
    }
  };
}

export function findAndAssign(strategy, selector, variableName, isArray) {
  return (dispatch, getState) => {
    const {assignedVarCache} = getState().inspector;

    // If this call to 'findAndAssign' for this variable wasn't done already, do it now
    if (!assignedVarCache[variableName]) {
      dispatch({
        type: RECORD_ACTION,
        action: 'findAndAssign',
        params: [strategy, selector, variableName, isArray],
      });
      dispatch({type: ADD_ASSIGNED_VAR_CACHE, varName: variableName});
    }
  };
}

export function setLocatorTestElement(elementId) {
  return async (dispatch, getState) => {
    dispatch({type: SET_LOCATOR_TEST_ELEMENT, elementId});
    dispatch({type: CLEAR_SEARCHED_FOR_ELEMENT_BOUNDS});
    if (elementId) {
      try {
        const action = callClientMethod({
          elementId,
          methodName: 'getRect',
          skipRefresh: true,
          skipRecord: true,
          ignoreResult: true,
        });
        const {commandRes} = await action(dispatch, getState);
        dispatch({
          type: SET_SEARCHED_FOR_ELEMENT_BOUNDS,
          location: {x: commandRes.x, y: commandRes.y},
          size: {width: commandRes.width, height: commandRes.height},
        });
      } catch (ign) {}
    }
  };
}

/**
 * Given an element ID found through search, and its bounds,
 * attempt to find and select this element in the source tree
 */
export function selectLocatedElement(sourceJSON, sourceXML, bounds, id) {
  const UPPER_FILTER_LIMIT = 10;

  // Parse the source tree and find all nodes whose bounds match the expected bounds
  // Return the path of each node
  function findPathsMatchingBounds() {
    if (!bounds || !sourceJSON.children || !sourceJSON.children[0].attributes) {
      return null;
    }
    if (sourceJSON.children[0].attributes.bounds) {
      const [endX, endY] = [
        bounds.location.x + bounds.size.width,
        bounds.location.y + bounds.size.height,
      ];
      const coords = `[${bounds.location.x},${bounds.location.y}][${endX},${endY}]`;
      return findPathsFromCoords(sourceJSON.children, coords);
    } else if (sourceJSON.children[0].attributes.x) {
      const combinedBounds = {
        x: String(bounds.location.x),
        y: String(bounds.location.y),
        height: String(bounds.size.height),
        width: String(bounds.size.width),
      };
      return findPathsFromBounds(sourceJSON.children, combinedBounds);
    }
    return null;
  }

  // Recursive function for parsing source tree when elements have 'bounds' property
  function findPathsFromCoords(trees, coords) {
    let collectedPaths = [];
    for (const tree of trees) {
      if (tree.attributes.bounds === coords) {
        collectedPaths.push(tree.path);
      }
      if (tree.children.length) {
        collectedPaths.push(...findPathsFromCoords(tree.children, coords));
      }
    }
    return collectedPaths;
  }

  // Recursive function for parsing source tree when elements have 'x/y/height/width' properties
  function findPathsFromBounds(trees, bounds) {
    let collectedPaths = [];
    for (const tree of trees) {
      if (
        tree.attributes.x === bounds.x &&
        tree.attributes.y === bounds.y &&
        tree.attributes.height === bounds.height &&
        tree.attributes.width === bounds.width
      ) {
        collectedPaths.push(tree.path);
      }
      if (tree.children.length) {
        collectedPaths.push(...findPathsFromBounds(tree.children, bounds));
      }
    }
    return collectedPaths;
  }

  // If findPathsMatchingBounds found multiple items,
  // use Appium findElement to filter further by element ID
  async function filterFoundPaths(foundPaths, dispatch, getState) {
    if (!foundPaths) {
      return null;
    }
    if (foundPaths.length === 1) {
      return foundPaths[0];
    } else if (foundPaths.length !== 0 && foundPaths.length <= UPPER_FILTER_LIMIT) {
      return await findElementWithMatchingId(foundPaths, dispatch, getState);
    }
    return null;
  }

  // For each provided path, get its xpath and call Appium findElement
  // Return the path of the element whose ID matches the expected ID
  async function findElementWithMatchingId(foundPaths, dispatch, getState) {
    const sourceDoc = domParser.parseFromString(sourceXML);
    for (const path of foundPaths) {
      const domNode = findDOMNodeByPath(path, sourceDoc);
      const xpath = getOptimalXPath(sourceDoc, domNode);
      const action = callClientMethod({strategy: 'xpath', selector: xpath});
      const {el} = await action(dispatch, getState);
      if (el && el.elementId === id) {
        return path;
      }
    }
    return null;
  }

  return async (dispatch, getState) => {
    dispatch({type: FINDING_ELEMENT_IN_SOURCE});
    const foundPaths = findPathsMatchingBounds();
    const foundPath = await filterFoundPaths(foundPaths, dispatch, getState);
    if (foundPath) {
      const action = selectElement(foundPath);
      await action(dispatch, getState);
    } else {
      showError(new Error(i18n.t('findingElementInSourceFailed')), {secs: 8});
    }
    dispatch({type: FINDING_ELEMENT_IN_SOURCE_COMPLETED});
  };
}

export function clearSearchResults() {
  return (dispatch) => {
    dispatch({type: CLEAR_SEARCH_RESULTS});
    dispatch({type: CLEAR_SEARCHED_FOR_ELEMENT_BOUNDS});
  };
}

export function selectScreenshotInteractionMode(screenshotInteractionMode) {
  return (dispatch) => {
    dispatch({type: SET_SCREENSHOT_INTERACTION_MODE, screenshotInteractionMode});
  };
}

export function toggleRefreshingState() {
  return (dispatch) => {
    dispatch({type: TOGGLE_REFRESHING_STATE});
  };
}

export function selectAppMode(mode) {
  return async (dispatch, getState) => {
    const {appMode} = getState().inspector;
    dispatch({type: SET_APP_MODE, mode});
    // if we're transitioning to hybrid mode, do a pre-emptive search for contexts
    if (appMode !== mode && mode === APP_MODE.WEB_HYBRID) {
      const action = applyClientMethod({methodName: 'getPageSource'});
      await action(dispatch, getState);
    }
    if (appMode !== mode && mode === APP_MODE.NATIVE) {
      const action = applyClientMethod({methodName: 'switchContext', args: [NATIVE_APP]});
      await action(dispatch, getState);
    }
  };
}

export function toggleShowCentroids() {
  return (dispatch, getState) => {
    const {showCentroids} = getState().inspector;
    const show = !showCentroids;
    dispatch({type: SET_SHOW_CENTROIDS, show});
  };
}

export function getActiveAppId(isIOS, isAndroid) {
  return async (dispatch, getState) => {
    try {
      if (isIOS) {
        const action = applyClientMethod({
          methodName: 'executeScript',
          args: ['mobile:activeAppInfo', []],
        });
        const {bundleId} = await action(dispatch, getState);
        dispatch({type: SET_APP_ID, appId: bundleId});
      }
      if (isAndroid) {
        const action = applyClientMethod({methodName: 'getCurrentPackage'});
        const appPackage = await action(dispatch, getState);
        dispatch({type: SET_APP_ID, appId: appPackage});
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`Could not Retrieve Active App ID: ${err}`);
    }
  };
}

export function getServerStatus() {
  return async (dispatch, getState) => {
    const status = applyClientMethod({methodName: 'status'});
    const {build} = await status(dispatch, getState);
    dispatch({type: SET_SERVER_STATUS, status: build});
  };
}

// Start the session timer once session starts
export function setSessionTime(time) {
  return (dispatch) => {
    dispatch({type: SET_SESSION_TIME, sessionStartTime: time});
  };
}

export function setCoordStart(coordStartX, coordStartY) {
  return (dispatch) => {
    dispatch({type: SET_COORD_START, coordStartX, coordStartY});
  };
}

export function setCoordEnd(coordEndX, coordEndY) {
  return (dispatch) => {
    dispatch({type: SET_COORD_END, coordEndX, coordEndY});
  };
}

export function clearCoordAction() {
  return (dispatch) => {
    dispatch({type: CLEAR_COORD_ACTION});
  };
}

export function selectInspectorTab(interaction) {
  return (dispatch) => {
    dispatch({type: SELECT_INSPECTOR_TAB, interaction});
  };
}

export function startEnteringCommandArgs(commandName, command) {
  return (dispatch) => {
    dispatch({type: ENTERING_COMMAND_ARGS, commandName, command});
  };
}

export function cancelPendingCommand() {
  return (dispatch) => {
    dispatch({type: CANCEL_PENDING_COMMAND});
  };
}

export function setCommandArg(index, value) {
  return (dispatch) => {
    dispatch({type: SET_COMMAND_ARG, index, value});
  };
}

export function setUserWaitTimeout(userWaitTimeout) {
  return (dispatch) => {
    dispatch({type: SET_USER_WAIT_TIMEOUT, userWaitTimeout});
  };
}

/**
 * Ping server every 30 seconds to prevent `newCommandTimeout` from killing session
 */
export function runKeepAliveLoop() {
  return (dispatch, getState) => {
    dispatch({type: SET_LAST_ACTIVE_MOMENT, lastActiveMoment: Date.now()});
    const {driver} = getState().inspector;

    const keepAliveInterval = setInterval(async () => {
      const {lastActiveMoment, showKeepAlivePrompt} = getState().inspector;
      console.log('Pinging Appium server to keep session active'); // eslint-disable-line no-console
      try {
        await driver.getTimeouts(); // Pings the Appium server to keep it alive
      } catch (ign) {}
      const now = Date.now();

      // If the new command limit has been surpassed, prompt user if they want to keep session going
      if (now - lastActiveMoment > NO_NEW_COMMAND_LIMIT && !showKeepAlivePrompt) {
        dispatch({type: PROMPT_KEEP_ALIVE});
      }
    }, KEEP_ALIVE_PING_INTERVAL);
    dispatch({type: SET_KEEP_ALIVE_INTERVAL, keepAliveInterval});
  };
}

/**
 * Get rid of the intervals to keep the session alive
 */
export function killKeepAliveLoop() {
  return (dispatch, getState) => {
    const {keepAliveInterval, userWaitTimeout} = getState().inspector;
    clearInterval(keepAliveInterval);
    if (userWaitTimeout) {
      clearTimeout(userWaitTimeout);
    }
    dispatch({type: SET_KEEP_ALIVE_INTERVAL, keepAliveInterval: null});
    dispatch({type: SET_USER_WAIT_TIMEOUT, userWaitTimeout: null});
  };
}

/**
 * Reset the new command clock and kill the wait for user timeout
 */
export function keepSessionAlive() {
  return (dispatch, getState) => {
    const {userWaitTimeout} = getState().inspector;
    dispatch({type: HIDE_PROMPT_KEEP_ALIVE});
    dispatch({type: SET_LAST_ACTIVE_MOMENT, lastActiveMoment: +new Date()});
    if (userWaitTimeout) {
      clearTimeout(userWaitTimeout);
      dispatch({type: SET_USER_WAIT_TIMEOUT, userWaitTimeout: null});
    }
  };
}

export function callClientMethod(params) {
  return async (dispatch, getState) => {
    const {driver, appMode, mjpegScreenshotUrl, isSourceRefreshOn} = getState().inspector;
    const {methodName, ignoreResult = true} = params;
    params.appMode = appMode;

    // don't retrieve screenshot if we're already using the mjpeg stream
    if (mjpegScreenshotUrl) {
      params.skipScreenshot = true;
    }

    if (!isSourceRefreshOn) {
      params.skipRefresh = true;
    }

    console.log(`Calling client method with params:`); // eslint-disable-line no-console
    console.log(params); // eslint-disable-line no-console
    const action = keepSessionAlive();
    action(dispatch, getState);
    const client = AppiumClient.instance(driver);
    const res = await client.run(params);
    let {commandRes} = res;

    // Ignore empty objects
    if (_.isObject(res) && _.isEmpty(res)) {
      commandRes = null;
    }

    if (!ignoreResult) {
      // if the user is running actions manually, we want to show the full response with the
      // ability to scroll etc...
      const result = JSON.stringify(commandRes, null, '  ');
      const truncatedResult = _.truncate(result, {length: 2000});
      console.log(`Result of client command was:`); // eslint-disable-line no-console
      console.log(truncatedResult); // eslint-disable-line no-console
      setVisibleCommandResult(result, methodName)(dispatch);
    }
    res.elementId = res.id;
    return res;
  };
}

export function setVisibleCommandResult(result, methodName) {
  return (dispatch) => {
    dispatch({type: SET_VISIBLE_COMMAND_RESULT, result, methodName});
  };
}

export function setAwaitingMjpegStream(isAwaiting) {
  return (dispatch) => {
    dispatch({type: SET_AWAITING_MJPEG_STREAM, isAwaiting});
  };
}

export function saveGesture(params) {
  return async (dispatch) => {
    let savedGestures = (await getSetting(SET_SAVED_GESTURES)) || [];
    if (!params.id) {
      params.id = UUID();
      params.date = Date.now();
      savedGestures.push(params);
    } else {
      for (const gesture of savedGestures) {
        if (gesture.id === params.id) {
          gesture.name = params.name;
          gesture.description = params.description;
          gesture.actions = params.actions;
        }
      }
    }
    await setSetting(SET_SAVED_GESTURES, savedGestures);
    const action = getSavedGestures();
    await action(dispatch);
  };
}

export function getSavedGestures() {
  return async (dispatch) => {
    dispatch({type: GET_SAVED_GESTURES_REQUESTED});
    const savedGestures = await getSetting(SET_SAVED_GESTURES);
    dispatch({type: GET_SAVED_GESTURES_DONE, savedGestures});
  };
}

export function deleteSavedGesture(id) {
  return async (dispatch) => {
    dispatch({type: DELETE_SAVED_GESTURES_REQUESTED, deleteGesture: id});
    const gestures = await getSetting(SET_SAVED_GESTURES);
    const newGestures = gestures.filter((gesture) => gesture.id !== id);
    await setSetting(SET_SAVED_GESTURES, newGestures);
    dispatch({type: DELETE_SAVED_GESTURES_DONE});
    dispatch({type: GET_SAVED_GESTURES_DONE, savedGestures: newGestures});
  };
}

export function showGestureEditor() {
  return (dispatch) => {
    dispatch({type: SHOW_GESTURE_EDITOR});
    dispatch({type: SET_SCREENSHOT_INTERACTION_MODE, screenshotInteractionMode: 'gesture'});
  };
}

export function hideGestureEditor() {
  return (dispatch) => {
    dispatch({type: HIDE_GESTURE_EDITOR});
    dispatch({type: SET_SCREENSHOT_INTERACTION_MODE, screenshotInteractionMode: 'select'});
  };
}

export function setLoadedGesture(loadedGesture) {
  return (dispatch) => {
    dispatch({type: SET_LOADED_GESTURE, loadedGesture});
  };
}

export function removeLoadedGesture() {
  return (dispatch) => {
    dispatch({type: REMOVE_LOADED_GESTURE});
  };
}

export function displayGesture(showGesture) {
  return (dispatch) => {
    dispatch({type: SHOW_GESTURE_ACTION, showGesture});
  };
}

export function removeGestureDisplay() {
  return (dispatch) => {
    dispatch({type: HIDE_GESTURE_ACTION});
  };
}

export function selectTick(tick) {
  return (dispatch, getState) => {
    const {tickCoordinates} = getState().inspector;

    if (tickCoordinates) {
      dispatch({type: SET_GESTURE_TAP_COORDS_MODE, x: undefined, y: undefined});
    }

    dispatch({type: SELECT_TICK_ELEMENT, selectedTick: tick});
  };
}

export function unselectTick() {
  return (dispatch) => {
    dispatch({type: CLEAR_TAP_COORDINATES});
    dispatch({type: UNSELECT_TICK_ELEMENT});
  };
}

export function tapTickCoordinates(x, y) {
  return (dispatch) => {
    dispatch({type: SET_GESTURE_TAP_COORDS_MODE, x, y});
  };
}

export function toggleShowAttributes() {
  return (dispatch) => {
    dispatch({type: TOGGLE_SHOW_ATTRIBUTES});
  };
}
