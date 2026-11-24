import sanitize from 'sanitize-filename';

import {SAVED_CLIENT_FRAMEWORK, SET_SAVED_GESTURES} from '../../shared/setting-defs.js';
import {COMMAND_EXECUTE_SCRIPT, COMMAND_UPDATE_SETTINGS} from '../constants/commands.js';
import {DRIVERS} from '../constants/common.js';
import {APP_MODE, NATIVE_APP, UNKNOWN_ERROR} from '../constants/session-inspector.js';
import i18n from '../i18next.js';
import InspectorDriver from '../lib/appium/inspector-driver.js';
import {CLIENT_FRAMEWORK_MAP} from '../lib/client-frameworks/map.js';
import {getSetting, setSetting} from '../polyfills.js';
import {
  addAssignedVarCache as addAssignedVarCacheAction,
  clearAssignedVarCache,
  clearCoordAction as clearCoordActionAction,
  clearRecording as clearRecordingAction,
  clearSearchResults as clearSearchResultsAction,
  clearSearchedForElementBounds,
  clearTapCoordinates,
  deleteSavedGesturesDone,
  deleteSavedGesturesRequested,
  findingElementInSource,
  findingElementInSourceCompleted,
  gestureUploadDone,
  gestureUploadRequested,
  getFindElementsTimes as getFindElementsTimesAction,
  getFindElementsTimesCompleted,
  getSavedGesturesDone,
  getSavedGesturesRequested,
  hideGestureAction,
  hideGestureEditor as hideGestureEditorAction,
  hideLocatorSearchModal as hideLocatorSearchModalAction,
  hidePromptKeepAlive,
  methodCallDone,
  methodCallRequested,
  pauseRecording as pauseRecordingAction,
  promptKeepAlive,
  quitSessionDone,
  recordAction as recordActionAction,
  removeLoadedGesture as removeLoadedGestureAction,
  searchingForElements,
  searchingForElementsCompleted,
  selectCentroid as selectCentroidAction,
  selectElement as selectElementAction,
  selectInspectorTab as selectInspectorTabAction,
  selectLocatedElement as selectLocatedElementAction,
  selectTickElement,
  setAppId,
  setAppMode as setAppModeAction,
  setAutoSessionRestart,
  setAwaitingMjpegStream as setAwaitingMjpegStreamAction,
  setClientFramework as setClientFrameworkAction,
  setContext as setContextAction,
  setCoordEnd as setCoordEndAction,
  setCoordStart as setCoordStartAction,
  setExpandedPaths as setExpandedPathsAction,
  setFlatSessionCaps,
  setGestureTapCoordsMode,
  setInteractionsNotAvailable,
  setKeepAliveInterval,
  setLastActiveMoment,
  setLoadedGesture as setLoadedGestureAction,
  setLocatorSearchStrategy as setLocatorSearchStrategyAction,
  setLocatorSearchValue as setLocatorSearchValueAction,
  setMjpegState as setMjpegStateAction,
  setOptimalLocators,
  setRefreshingState as setRefreshingStateAction,
  setScreenshotInteractionMode,
  setSearchedForElementBounds,
  setSelectedElementId,
  setServerStatus,
  setSessionDetails as setSessionDetailsAction,
  setSessionTime as setSessionTimeAction,
  setShowBoilerplate,
  setShowCentroids,
  setSourceAndScreenshot,
  setUserWaitTimeout as setUserWaitTimeoutAction,
  showGestureAction,
  showGestureEditor as showGestureEditorAction,
  showLocatorSearchModal as showLocatorSearchModalAction,
  startRecording as startRecordingAction,
  storeSessionSettings as storeSessionSettingsAction,
  toggleShowAttributes as toggleShowAttributesAction,
  unselectCentroid as unselectCentroidAction,
  unselectElement as unselectElementAction,
  unselectTickElement,
} from '../reducers/SessionInspector.js';
import {debounce, isEmpty, omit} from '../utils/common.js';
import {downloadFile, readTextFromUploadedFiles} from '../utils/file-handling.js';
import {parseGestureFileContents} from '../utils/gesturefile-parsing.js';
import {getSuggestedLocators} from '../utils/locator-generation/common.js';
import {getOptimalXPath} from '../utils/locator-generation/xpath.js';
import {log} from '../utils/logger.js';
import {notification} from '../utils/notification.js';
import {getRandomId} from '../utils/other.js';
import {findDOMNodeByPath, findJSONElementByPath, xmlToDOM, xmlToJSON} from '../utils/source-parsing.js';
import {newSession, showError} from './SessionBuilder.js';

const KEEP_ALIVE_PING_INTERVAL = 20 * 1000;
const NO_NEW_COMMAND_LIMIT = 24 * 60 * 60 * 1000; // Set timeout to 24 hours

// Sets the selected element in the source tree/state based on its path, and
// calculates the locator strategies that can later be used to look it up via Appium.
// Shared by selectElement and tapElement.
// Returns the computed strategy map.
function prepareElementSelection(path, dispatch, getState) {
  const {sourceJSON, sourceXML, expandedPaths, currentContext, featureCaps} = getState().inspector;
  const isNative = currentContext === NATIVE_APP;
  // Set the selected element in the source tree
  const selectedElement = findJSONElementByPath(path, sourceJSON);
  dispatch(selectElementAction(selectedElement));

  // Expand all of this element's ancestors so that it's visible in the source tree
  // Make a copy of the array to avoid state mutation
  const copiedExpandedPaths = [...expandedPaths];
  let pathArr = path.split('.').slice(0, path.length - 1);
  while (pathArr.length > 1) {
    pathArr.splice(pathArr.length - 1);
    let ancestorPath = pathArr.join('.');
    if (!copiedExpandedPaths.includes(ancestorPath)) {
      copiedExpandedPaths.push(ancestorPath);
    }
  }
  dispatch(setExpandedPathsAction(copiedExpandedPaths));

  // Calculate the recommended locator strategies
  const strategyMap = getSuggestedLocators(selectedElement, sourceXML, isNative, featureCaps.automationName);
  dispatch(setOptimalLocators(strategyMap));

  return strategyMap;
}

// Calls Appium's findElement for each candidate strategy/selector until one succeeds,
// caches the resulting elementId, and returns it (or null if none of them worked).
// Shared by selectElement (debounced below) and tapElement (called immediately).
async function resolveElementId(strategyMap, dispatch, getState, path) {
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
      dispatch(setSelectedElementId(elementId));
      return elementId;
    }
  }

  dispatch(setInteractionsNotAvailable());
  return null;
}

// A debounced wrapper around resolveElementId, used while browsing/selecting elements
// one at a time (Element Mode), so that quickly selecting several elements in a row
// doesn't trigger a redundant Appium findElement call for each one.
const debouncedResolveElementId = debounce(resolveElementId, 1000);

export function selectElement(path) {
  return async (dispatch, getState) => {
    const strategyMap = prepareElementSelection(path, dispatch, getState);

    // Debounce find element so that if another element is selected shortly after, cancel the previous search
    await debouncedResolveElementId(strategyMap, dispatch, getState, path);
  };
}

export function unselectElement() {
  return (dispatch) => {
    dispatch(unselectElementAction());
  };
}

// Selects the element at the given source path and immediately taps it (elementClick),
// in a single action. Used by the 'Tap By Element' screenshot interaction mode, where
// every click is a deliberate one-shot action rather than a browsing/hover selection,
// so (unlike selectElement) this resolves the element right away instead of debouncing.
export function tapElement(path) {
  return async (dispatch, getState) => {
    const strategyMap = prepareElementSelection(path, dispatch, getState);

    // Cancel any pending debounced resolution left over from Element Mode, so it can't
    // race with (and overwrite the result of) this immediate resolution.
    debouncedResolveElementId.cancel();
    const elementId = await resolveElementId(strategyMap, dispatch, getState, path);
    if (elementId) {
      const tapAction = applyClientMethod({methodName: 'elementClick', elementId});
      await tapAction(dispatch, getState);
    }
  };
}

export function selectCentroid(path) {
  return (dispatch) => {
    dispatch(selectCentroidAction(path));
  };
}

export function unselectCentroid() {
  return (dispatch) => {
    dispatch(unselectCentroidAction());
  };
}

/**
 * Requests a method call on appium
 */
export function applyClientMethod(params) {
  return async (dispatch, getState) => {
    const isRecording =
      params.methodName !== 'deleteSession' &&
      params.methodName !== 'getPageSource' &&
      params.methodName !== 'gesture' &&
      getState().inspector.isRecording;
    dispatch(methodCallRequested());
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
      dispatch(recordActionAction({action: params.methodName, params: args}));
    }
    // If updating settings, store the updated values
    if (params.methodName === COMMAND_UPDATE_SETTINGS) {
      const storeSettingsAction = storeSessionSettings(params.args[0]);
      await storeSettingsAction(dispatch, getState);
    }
    dispatch(methodCallDone());

    if (source) {
      dispatch(
        setSourceAndScreenshot({
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
        }),
      );
    }
    window.dispatchEvent(new Event('resize'));
    return commandRes;
  };
}

export function restartSession(error, params) {
  return async (dispatch, getState) => {
    if (error?.name !== UNKNOWN_ERROR) {
      showError(error, {methodName: params.methodName, secs: 10});
      return dispatch(methodCallDone());
    }
    showError(error, {methodName: params.methodName, secs: 3});
    notification.info({
      title: i18n.t('RestartSessionMessage'),
      duration: 3,
    });
    const quitSes = quitSession();
    const newSes = newSession(getState().builder.caps);
    const getPageSrc = applyClientMethod({methodName: 'getPageSource'});
    const storeSessionSet = storeSessionSettings();
    const getSavedClientFrame = getSavedClientFramework();
    const runKeepAliveLp = runKeepAliveLoop();
    const setSesTime = setSessionTime(Date.now());

    await quitSes(dispatch, getState);
    await newSes(dispatch, getState);
    await getPageSrc(dispatch, getState);
    await storeSessionSet(dispatch, getState);
    await getSavedClientFrame(dispatch);
    runKeepAliveLp(dispatch, getState);
    setSesTime(dispatch);
    dispatch(setAutoSessionRestart(true));
    dispatch(methodCallDone());
  };
}

export function addAssignedVarCache(varName) {
  return (dispatch) => {
    dispatch(addAssignedVarCacheAction(varName));
  };
}

export function setExpandedPaths(paths) {
  return (dispatch) => {
    dispatch(setExpandedPathsAction(paths));
  };
}

/**
 * Quit the session and go back to the new session window
 */
export function quitSession({reason, manualQuit = true, detachOnly = false} = {}) {
  return async (dispatch, getState) => {
    const killAction = killKeepAliveLoop();
    killAction(dispatch, getState);
    if (!detachOnly) {
      const applyAction = applyClientMethod({methodName: 'deleteSession'});
      await applyAction(dispatch, getState);
    }
    dispatch(quitSessionDone());
    InspectorDriver.clearInstance(); // clear the 'cached' driver instance
    if (!manualQuit) {
      showError(new Error(reason || i18n.t('Session has been terminated')), {secs: 0});
    }
  };
}

export function startRecording() {
  return (dispatch) => {
    dispatch(startRecordingAction());
  };
}

export function pauseRecording() {
  return (dispatch) => {
    dispatch(pauseRecordingAction());
  };
}

export function clearRecording() {
  return (dispatch) => {
    dispatch(clearRecordingAction());
    dispatch(clearAssignedVarCache()); // Get rid of the variable cache
  };
}

export function getSavedClientFramework() {
  return async (dispatch) => {
    let framework = await getSetting(SAVED_CLIENT_FRAMEWORK);
    dispatch(setClientFrameworkAction(framework));
  };
}

export function setClientFramework(framework) {
  return async (dispatch) => {
    if (!CLIENT_FRAMEWORK_MAP[framework]) {
      throw new Error(i18n.t('frameworkNotSupported', {framework}));
    }
    await setSetting(SAVED_CLIENT_FRAMEWORK, framework);
    dispatch(setClientFrameworkAction(framework));
  };
}

export function recordAction(action, params) {
  return (dispatch) => {
    dispatch(recordActionAction({action, params}));
  };
}

export function toggleShowBoilerplate() {
  return (dispatch, getState) => {
    const show = !getState().inspector.showBoilerplate;
    dispatch(setShowBoilerplate(show));
  };
}

export function setSessionDetails({serverDetails, driver, sessionCaps, appMode, isUsingMjpegMode}) {
  return (dispatch) => {
    // Extract several capabilities from the finalised set of caps
    // that may be relevant for enabling specific Inspector features
    const featureCaps = {};
    for (const stringCapName of ['automationName', 'browserName', 'platformName']) {
      featureCaps[stringCapName] = driver.capabilities[stringCapName]?.toLowerCase();
    }
    // Convert platformVersion to a float - even if it is in a semver-style format, where conversion
    // will only retain the first major & minor versions, this is sufficient for feature-gating
    featureCaps.platformVersion = parseFloat(driver.capabilities.platformVersion, 10) || undefined;

    dispatch(
      setSessionDetailsAction({
        serverDetails,
        driver,
        sessionCaps,
        featureCaps,
        appMode,
        isUsingMjpegMode,
      }),
    );
  };
}

export function storeSessionSettings(updatedSessionSettings = null) {
  return async (dispatch, getState) => {
    let sessionSettings = updatedSessionSettings;
    if (sessionSettings === null) {
      const action = applyClientMethod({
        methodName: 'getSettings',
        skipRefresh: true,
      });
      sessionSettings = await action(dispatch, getState);
    }
    dispatch(storeSessionSettingsAction(sessionSettings));
  };
}

export function showLocatorSearchModal() {
  return (dispatch) => {
    dispatch(showLocatorSearchModalAction());
  };
}

export function hideLocatorSearchModal() {
  return (dispatch) => {
    dispatch(hideLocatorSearchModalAction());
  };
}

export function setLocatorSearchValue(locatorSearchValue) {
  return (dispatch) => {
    dispatch(setLocatorSearchValueAction(locatorSearchValue));
  };
}

export function setLocatorSearchStrategy(locatorSearchStrategy) {
  return (dispatch) => {
    dispatch(setLocatorSearchStrategyAction(locatorSearchStrategy));
  };
}

export function setContext(context) {
  return (dispatch) => {
    dispatch(setContextAction(context));
  };
}

export function searchForElement(strategy, selector) {
  return async (dispatch, getState) => {
    const isRecording = getState().inspector.isRecording;
    dispatch(searchingForElements());
    try {
      const callAction = callClientMethod({strategy, selector, fetchArray: true});
      let {elements, variableName, executionTime} = await callAction(dispatch, getState);
      if (isRecording) {
        const findAction = findAndAssign(strategy, selector, variableName, true);
        findAction(dispatch, getState);
      }
      elements = elements.map((el) => el.id);
      dispatch(searchingForElementsCompleted({elements, executionTime}));
    } catch (error) {
      dispatch(searchingForElementsCompleted());
      showError(error, {methodName: 10});
    }
  };
}

/**
 * Get all the find element times based on the find data source
 */
export function getFindElementsTimes(findDataSource) {
  return async (dispatch, getState) => {
    dispatch(getFindElementsTimesAction());
    try {
      const findElementsExecutionTimes = [];
      for (const element of findDataSource) {
        const {find, key, selector} = element;
        const action = callClientMethod({strategy: key, selector});
        const {executionTime} = await action(dispatch, getState);
        findElementsExecutionTimes.push({find, key, selector, time: executionTime});
      }

      dispatch(
        getFindElementsTimesCompleted({
          findElementsExecutionTimes: [...findElementsExecutionTimes].sort((a, b) => a.time - b.time),
        }),
      );
    } catch (error) {
      dispatch(getFindElementsTimesCompleted());
      showError(error, {methodName: 10});
    }
  };
}

export function findAndAssign(strategy, selector, variableName, isArray) {
  return (dispatch, getState) => {
    const {assignedVarCache} = getState().inspector;

    // If this call to 'findAndAssign' for this variable wasn't done already, do it now
    if (!assignedVarCache[variableName]) {
      dispatch(
        recordActionAction({
          action: 'findAndAssign',
          params: [strategy, selector, variableName, isArray],
        }),
      );
      dispatch(addAssignedVarCacheAction(variableName));
    }
  };
}

export function selectLocatedElement(elementId) {
  return async (dispatch, getState) => {
    dispatch(selectLocatedElementAction(elementId));
    dispatch(clearSearchedForElementBounds());
    if (elementId) {
      try {
        const action = callClientMethod({
          elementId,
          methodName: 'getElementRect',
          skipRefresh: true,
          skipRecord: true,
        });
        const {commandRes} = await action(dispatch, getState);
        dispatch(
          setSearchedForElementBounds({
            location: {x: commandRes.x, y: commandRes.y},
            size: {width: commandRes.width, height: commandRes.height},
          }),
        );
      } catch {}
    }
  };
}

/**
 * Given an element ID found through search, and its bounds,
 * attempt to find and select this element in the source tree
 */
export function findLocatedElementInSource(sourceJSON, sourceXML, bounds, id) {
  const UPPER_FILTER_LIMIT = 10;

  // Parse the source tree and find all nodes whose bounds match the expected bounds
  // Return the path of each node
  function findPathsMatchingBounds() {
    if (!bounds || !sourceJSON.children?.[0]?.attributes) {
      return null;
    }
    if (sourceJSON.children[0].attributes.bounds) {
      const [endX, endY] = [bounds.location.x + bounds.size.width, bounds.location.y + bounds.size.height];
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
    const sourceDoc = xmlToDOM(sourceXML);
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
    dispatch(findingElementInSource());
    const foundPaths = findPathsMatchingBounds();
    const foundPath = await filterFoundPaths(foundPaths, dispatch, getState);
    if (foundPath) {
      const action = selectElement(foundPath);
      await action(dispatch, getState);
    } else {
      showError(new Error(i18n.t('findingElementInSourceFailed')), {secs: 8});
    }
    dispatch(findingElementInSourceCompleted());
  };
}

export function clearSearchResults() {
  return (dispatch) => {
    dispatch(clearSearchResultsAction());
    dispatch(clearSearchedForElementBounds());
  };
}

export function setMjpegState(targetMjpegState) {
  return (dispatch) => {
    dispatch(setMjpegStateAction(targetMjpegState));
  };
}

export function selectScreenshotInteractionMode(screenshotInteractionMode) {
  return (dispatch) => {
    dispatch(setScreenshotInteractionMode(screenshotInteractionMode));
  };
}

export function setRefreshingState(refreshStates) {
  return (dispatch) => {
    dispatch(setRefreshingStateAction(refreshStates));
  };
}

export function selectAppMode(mode) {
  return async (dispatch, getState) => {
    const {appMode} = getState().inspector;
    dispatch(setAppModeAction(mode));
    // if we're transitioning to hybrid mode, do a pre-emptive search for contexts
    if (appMode !== mode && mode === APP_MODE.WEB_HYBRID) {
      const action = applyClientMethod({methodName: 'getPageSource'});
      await action(dispatch, getState);
    }
    if (appMode !== mode && mode === APP_MODE.NATIVE) {
      const action = applyClientMethod({methodName: 'switchAppiumContext', args: [NATIVE_APP]});
      await action(dispatch, getState);
    }
  };
}

export function toggleShowCentroids() {
  return (dispatch, getState) => {
    const {showCentroids} = getState().inspector;
    const show = !showCentroids;
    dispatch(setShowCentroids(show));
  };
}

export function getActiveAppId(automationName) {
  return async (dispatch, getState) => {
    try {
      if (automationName === DRIVERS.XCUITEST) {
        // mobile:activeAppInfo exists since XCUITest 2.126.0 (pre-Appium 2)
        const action = applyClientMethod({
          methodName: COMMAND_EXECUTE_SCRIPT,
          args: ['mobile:activeAppInfo', []],
          skipRefresh: true,
        });
        const {bundleId} = await action(dispatch, getState);
        dispatch(setAppId(bundleId));
      }
      if ([DRIVERS.UIAUTOMATOR2, DRIVERS.ESPRESSO].includes(automationName)) {
        // mobile:getCurrentPackage exists since UiA2 2.20 / Espresso 2.23 (Appium 2)
        const action = applyClientMethod({
          methodName: COMMAND_EXECUTE_SCRIPT,
          args: ['mobile:getCurrentPackage', []],
          skipRefresh: true,
        });
        const appPackage = await action(dispatch, getState);
        dispatch(setAppId(appPackage));
      }
    } catch (err) {
      log.error(`Could not Retrieve Active App ID: ${err}`);
    }
  };
}

export function getServerStatus() {
  return async (dispatch, getState) => {
    const status = applyClientMethod({methodName: 'status', skipRefresh: true});
    const {build} = await status(dispatch, getState);
    dispatch(setServerStatus(build));
  };
}

export function getFlatSessionCaps() {
  return async (dispatch, getState) => {
    try {
      const action = applyClientMethod({methodName: 'getAppiumSessionCapabilities', skipRefresh: true});
      const getCapsResponse = await action(dispatch, getState);
      const flatSessionCaps = getCapsResponse.capabilities;
      dispatch(setFlatSessionCaps(flatSessionCaps));
    } catch {
      // No longer supported since Appium 4
      const action = applyClientMethod({methodName: 'getSession', skipRefresh: true});
      const flatSessionCaps = await action(dispatch, getState);
      dispatch(setFlatSessionCaps(flatSessionCaps));
    }
  };
}

// Start the session timer once session starts
export function setSessionTime(time) {
  return (dispatch) => {
    dispatch(setSessionTimeAction(time));
  };
}

export function setCoordStart(coordStartX, coordStartY) {
  return (dispatch) => {
    dispatch(setCoordStartAction({x: coordStartX, y: coordStartY}));
  };
}

export function setCoordEnd(coordEndX, coordEndY) {
  return (dispatch) => {
    dispatch(setCoordEndAction({x: coordEndX, y: coordEndY}));
  };
}

export function clearCoordAction() {
  return (dispatch) => {
    dispatch(clearCoordActionAction());
  };
}

export function selectInspectorTab(interaction) {
  return (dispatch) => {
    dispatch(selectInspectorTabAction(interaction));
  };
}

export function getSupportedSessionMethods() {
  return async (dispatch, getState) => {
    async function safelyCallCommand(methodName) {
      try {
        const action = executeDriverCommand({methodName});
        const {commandRes} = await action(dispatch, getState);
        return commandRes;
      } catch {
        return [];
      }
    }

    const [commands, executeMethods] = await Promise.all([
      safelyCallCommand('getAppiumCommands'),
      safelyCallCommand('getAppiumExtensions'),
    ]);
    return {commands, executeMethods};
  };
}

export function setUserWaitTimeout(userWaitTimeout) {
  return (dispatch) => {
    dispatch(setUserWaitTimeoutAction(userWaitTimeout));
  };
}

/**
 * Ping server every 30 seconds to prevent `newCommandTimeout` from killing session
 */
export function runKeepAliveLoop() {
  return (dispatch, getState) => {
    dispatch(setLastActiveMoment(Date.now()));
    const {driver} = getState().inspector;

    const keepAliveInterval = setInterval(async () => {
      const {lastActiveMoment, showKeepAlivePrompt} = getState().inspector;
      log.info('Pinging Appium server to keep session active');
      try {
        await driver.getTimeouts(); // Pings the Appium server to keep it alive
      } catch {}
      const now = Date.now();

      // If the new command limit has been surpassed, prompt user if they want to keep session going
      if (now - lastActiveMoment > NO_NEW_COMMAND_LIMIT && !showKeepAlivePrompt) {
        dispatch(promptKeepAlive());
      }
    }, KEEP_ALIVE_PING_INTERVAL);
    dispatch(setKeepAliveInterval(keepAliveInterval));
  };
}

/**
 * Get rid of the intervals to keep the session alive
 */
export function killKeepAliveLoop() {
  return (dispatch, getState) => {
    const {keepAliveInterval} = getState().inspector;
    clearInterval(keepAliveInterval);
    dispatch(setKeepAliveInterval(null));
  };
}

/**
 * Reset the new command clock and kill the wait for user timeout
 */
export function keepSessionAlive() {
  return (dispatch, getState) => {
    const {userWaitTimeout} = getState().inspector;
    dispatch(hidePromptKeepAlive());
    dispatch(setLastActiveMoment(+new Date()));
    if (userWaitTimeout) {
      clearTimeout(userWaitTimeout);
      dispatch(setUserWaitTimeoutAction(null));
    }
  };
}

export function callClientMethod(params) {
  return async (dispatch, getState) => {
    const {driver, appMode, isUsingMjpegMode, isSourceRefreshOn, autoSessionRestart} = getState().inspector;
    params.appMode = appMode;
    params.autoSessionRestart = autoSessionRestart;

    // don't retrieve screenshot if we're already using the mjpeg stream
    if (isUsingMjpegMode) {
      params.skipScreenshot = true;
    }

    if (!isSourceRefreshOn) {
      params.skipRefresh = true;
    }

    log.info(`Calling client method with params:`);
    log.info(params);
    try {
      const action = keepSessionAlive();
      action(dispatch, getState);
      const inspectorDriver = InspectorDriver.instance(driver);
      const res = await inspectorDriver.run(params);
      res.elementId = res.id;
      return res;
    } catch (error) {
      log.error(error);
      if (getState().inspector.autoSessionRestart) {
        const restartSes = restartSession(error, params);
        return await restartSes(dispatch, getState);
      }
      showError(error, {methodName: params.methodName, secs: 10});
      dispatch(methodCallDone());
    }
  };
}

// Simple alternative to callClientMethod, for when we only want to
// run the command without any side-effects
export function executeDriverCommand(params) {
  return async (_dispatch, getState) => {
    const {driver} = getState().inspector;
    params.skipRefresh = true;
    log.info(`Calling client method with params:`);
    log.info(params);
    const inspectorDriver = InspectorDriver.instance(driver);
    return await inspectorDriver.run(params);
  };
}

export function setAwaitingMjpegStream(isAwaiting) {
  return (dispatch) => {
    dispatch(setAwaitingMjpegStreamAction(isAwaiting));
  };
}

export function importGestureFiles(fileList) {
  return async (dispatch) => {
    dispatch(gestureUploadRequested());
    const gestures = await readTextFromUploadedFiles(fileList);
    const invalidGestureFiles = [];
    const parsedGestures = [];
    for (const gesture of gestures) {
      const {fileName, content, error} = gesture;
      // Some error occurred while reading the uploaded file
      if (error) {
        invalidGestureFiles.push(fileName);
        continue;
      }
      const gestureJSON = parseAndValidateGestureFileString(content);
      if (!gestureJSON) {
        invalidGestureFiles.push(fileName);
        continue;
      }
      parsedGestures.push(gestureJSON);
    }

    for (const parsedGesture of parsedGestures) {
      await saveGesture(parsedGesture)(dispatch);
    }
    dispatch(gestureUploadDone());

    if (!isEmpty(invalidGestureFiles)) {
      notification.error({
        title: i18n.t('unableToImportGestureFiles', {fileNames: invalidGestureFiles.join(', ')}),
        duration: 0,
      });
    }
  };
}

export function exportSavedGesture(gestureJSON) {
  return async () => {
    const cleanedName = `gesture-${gestureJSON.name}`;
    const gestureToExport = omit(gestureJSON, ['id', 'date']);
    const href = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(gestureToExport, null, 2))}`;
    const escapedName = sanitize(cleanedName, {replacement: '_'});
    const fileName = `${escapedName}.json`;
    downloadFile(href, fileName);
  };
}

export function saveGesture(gesture) {
  return async (dispatch) => {
    const savedGestures = (await getSetting(SET_SAVED_GESTURES)) || [];

    if (gesture.id) {
      // Editing an already saved gesture
      for (const savedGesture of savedGestures) {
        if (savedGesture.id === gesture.id) {
          savedGesture.name = gesture.name;
          savedGesture.description = gesture.description;
          savedGesture.actions = gesture.actions;
        }
      }
    } else {
      // Adding a new gesture
      gesture.id = getRandomId();
      gesture.date = Date.now();
      savedGestures.push(gesture);
    }

    await setSetting(SET_SAVED_GESTURES, savedGestures);
    const action = getSavedGestures();
    await action(dispatch);
  };
}

export function getSavedGestures() {
  return async (dispatch) => {
    dispatch(getSavedGesturesRequested());
    const savedGestures = await getSetting(SET_SAVED_GESTURES);
    dispatch(getSavedGesturesDone(savedGestures));
  };
}

export function deleteSavedGesture(id) {
  return async (dispatch) => {
    dispatch(deleteSavedGesturesRequested(id));
    const gestures = await getSetting(SET_SAVED_GESTURES);
    const newGestures = gestures.filter((gesture) => gesture.id !== id);
    await setSetting(SET_SAVED_GESTURES, newGestures);
    dispatch(deleteSavedGesturesDone());
    dispatch(getSavedGesturesDone(newGestures));
  };
}

export function showGestureEditor() {
  return (dispatch) => {
    dispatch(showGestureEditorAction());
    dispatch(setScreenshotInteractionMode('gesture'));
  };
}

export function hideGestureEditor() {
  return (dispatch) => {
    dispatch(hideGestureEditorAction());
    dispatch(setScreenshotInteractionMode('select'));
  };
}

export function setLoadedGesture(loadedGesture) {
  return (dispatch) => {
    dispatch(setLoadedGestureAction(loadedGesture));
  };
}

export function removeLoadedGesture() {
  return (dispatch) => {
    dispatch(removeLoadedGestureAction());
  };
}

export function displayGesture(showGesture) {
  return (dispatch) => {
    dispatch(showGestureAction(showGesture));
  };
}

export function removeGestureDisplay() {
  return (dispatch) => {
    dispatch(hideGestureAction());
  };
}

export function selectTick(tick) {
  return (dispatch, getState) => {
    const {tickCoordinates} = getState().inspector;

    if (tickCoordinates) {
      dispatch(setGestureTapCoordsMode({x: undefined, y: undefined}));
    }

    dispatch(selectTickElement(tick));
  };
}

export function unselectTick() {
  return (dispatch) => {
    dispatch(clearTapCoordinates());
    dispatch(unselectTickElement());
  };
}

export function tapTickCoordinates(x, y) {
  return (dispatch) => {
    dispatch(setGestureTapCoordsMode({x, y}));
  };
}

export function toggleShowAttributes() {
  return (dispatch) => {
    dispatch(toggleShowAttributesAction());
  };
}

export function toggleAutoSessionRestart() {
  return (dispatch, getState) => {
    const autoSessionRestart = !getState().inspector.autoSessionRestart;
    dispatch(setAutoSessionRestart(autoSessionRestart));
  };
}

function parseAndValidateGestureFileString(gestureFileString) {
  const gestureJSON = parseGestureFileContents(gestureFileString);
  if (gestureJSON === null) {
    return null;
  }
  return omit(gestureJSON, ['id', 'date']);
}
