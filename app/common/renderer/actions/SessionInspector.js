import _ from 'lodash';
import sanitize from 'sanitize-filename';

import {
  SAVED_CLIENT_FRAMEWORK,
  SAVED_TEST_FLOWS,
  SET_SAVED_GESTURES,
} from '../../shared/setting-defs.js';
import {
  APP_MODE,
  NATIVE_APP,
  TEST_FLOW_EXPORT_FORMATS,
  UNKNOWN_ERROR,
} from '../constants/session-inspector.js';
import i18n from '../i18next.js';
import InspectorDriver from '../lib/appium/inspector-driver.js';
import {CLIENT_FRAMEWORK_MAP} from '../lib/client-frameworks/map.js';
import {normalizeTestFlowStepDelayMs} from '../lib/test-flow-recorder/common.js';
import {
  exportPytestFile,
  getSetting,
  onPytestLog,
  runPytestFile,
  setSetting,
} from '../polyfills.js';
import {downloadFile, readTextFromUploadedFiles} from '../utils/file-handling.js';
import {parseGestureFileContents} from '../utils/gesturefile-parsing.js';
import {getSuggestedLocators} from '../utils/locator-generation/common.js';
import {getOptimalXPath} from '../utils/locator-generation/xpath.js';
import {log} from '../utils/logger.js';
import {notification} from '../utils/notification.js';
import {getRandomId} from '../utils/other.js';
import {rankSmartLocators} from '../utils/smart-locators/locator-scoring.js';
import {
  findDOMNodeByPath,
  findJSONElementByPath,
  xmlToDOM,
  xmlToJSON,
} from '../utils/source-parsing.js';
import {newSession, showError} from './SessionBuilder.js';

export const SET_SESSION_DETAILS = 'SET_SESSION_DETAILS';
export const SET_SOURCE_AND_SCREENSHOT = 'SET_SOURCE_AND_SCREENSHOT';
export const STORE_SESSION_SETTINGS = 'STORE_SESSION_SETTINGS';
export const SESSION_DONE = 'SESSION_DONE';
export const SELECT_ELEMENT = 'SELECT_ELEMENT';
export const UNSELECT_ELEMENT = 'UNSELECT_ELEMENT';
export const SET_SELECTED_ELEMENT_ID = 'SET_SELECTED_ELEMENT_ID';
export const SET_INTERACTIONS_NOT_AVAILABLE = 'SET_INTERACTIONS_NOT_AVAILABLE';
export const METHOD_CALL_REQUESTED = 'METHOD_CALL_REQUESTED';
export const METHOD_CALL_DONE = 'METHOD_CALL_DONE';
export const SET_EXPANDED_PATHS = 'SET_EXPANDED_PATHS';
export const SET_OPTIMAL_LOCATORS = 'SET_OPTIMAL_LOCATORS';
export const VALIDATE_SMART_LOCATORS_REQUESTED = 'VALIDATE_SMART_LOCATORS_REQUESTED';
export const VALIDATE_SMART_LOCATORS_COMPLETED = 'VALIDATE_SMART_LOCATORS_COMPLETED';

export const SELECT_CENTROID = 'SELECT_CENTROID';
export const UNSELECT_CENTROID = 'UNSELECT_CENTROID';
export const SET_SHOW_CENTROIDS = 'SET_SHOW_CENTROIDS';

export const QUIT_SESSION_REQUESTED = 'QUIT_SESSION_REQUESTED';
export const QUIT_SESSION_DONE = 'QUIT_SESSION_DONE';
export const SET_SESSION_TIME = 'SET_SESSION_TIME';

export const START_RECORDING = 'START_RECORDING';
export const PAUSE_RECORDING = 'PAUSE_RECORDING';
export const CLEAR_RECORDING = 'CLEAR_RECORDING';
export const SET_CLIENT_FRAMEWORK = 'SET_CLIENT_FRAMEWORK';
export const RECORD_ACTION = 'RECORD_ACTION';
export const SET_SHOW_BOILERPLATE = 'SET_SHOW_BOILERPLATE';
export const START_TEST_FLOW_RECORDING = 'START_TEST_FLOW_RECORDING';
export const PAUSE_TEST_FLOW_RECORDING = 'PAUSE_TEST_FLOW_RECORDING';
export const CLEAR_TEST_FLOW = 'CLEAR_TEST_FLOW';
export const APPEND_TEST_FLOW_ACTION_STEP = 'APPEND_TEST_FLOW_ACTION_STEP';
export const APPEND_TEST_FLOW_ASSERTION_STEP = 'APPEND_TEST_FLOW_ASSERTION_STEP';
export const APPEND_TEST_FLOW_BRANCH_STEP = 'APPEND_TEST_FLOW_BRANCH_STEP';
export const UPDATE_TEST_FLOW_STEP = 'UPDATE_TEST_FLOW_STEP';
export const REMOVE_TEST_FLOW_STEP = 'REMOVE_TEST_FLOW_STEP';
export const REORDER_TEST_FLOW_STEPS = 'REORDER_TEST_FLOW_STEPS';
export const SET_TEST_FLOW_EXPORT_FORMAT = 'SET_TEST_FLOW_EXPORT_FORMAT';
export const SET_TEST_FLOW_STEP_DELAY_MS = 'SET_TEST_FLOW_STEP_DELAY_MS';
export const CLEAR_TEST_FLOW_PYTEST_OUTPUT = 'CLEAR_TEST_FLOW_PYTEST_OUTPUT';
export const RUN_TEST_FLOW_CURRENT_SESSION_REQUESTED = 'RUN_TEST_FLOW_CURRENT_SESSION_REQUESTED';
export const RUN_TEST_FLOW_CURRENT_SESSION_COMPLETED = 'RUN_TEST_FLOW_CURRENT_SESSION_COMPLETED';
export const RUN_TEST_FLOW_CURRENT_SESSION_FAILED = 'RUN_TEST_FLOW_CURRENT_SESSION_FAILED';
export const APPEND_TEST_FLOW_CURRENT_SESSION_OUTPUT = 'APPEND_TEST_FLOW_CURRENT_SESSION_OUTPUT';
export const EXPORT_TEST_FLOW_PYTEST_REQUESTED = 'EXPORT_TEST_FLOW_PYTEST_REQUESTED';
export const EXPORT_TEST_FLOW_PYTEST_COMPLETED = 'EXPORT_TEST_FLOW_PYTEST_COMPLETED';
export const EXPORT_TEST_FLOW_PYTEST_FAILED = 'EXPORT_TEST_FLOW_PYTEST_FAILED';
export const RUN_TEST_FLOW_PYTEST_REQUESTED = 'RUN_TEST_FLOW_PYTEST_REQUESTED';
export const RUN_TEST_FLOW_PYTEST_COMPLETED = 'RUN_TEST_FLOW_PYTEST_COMPLETED';
export const RUN_TEST_FLOW_PYTEST_FAILED = 'RUN_TEST_FLOW_PYTEST_FAILED';
export const APPEND_TEST_FLOW_PYTEST_OUTPUT = 'APPEND_TEST_FLOW_PYTEST_OUTPUT';

export const GET_SAVED_TEST_FLOWS_REQUESTED = 'GET_SAVED_TEST_FLOWS_REQUESTED';
export const GET_SAVED_TEST_FLOWS_DONE = 'GET_SAVED_TEST_FLOWS_DONE';
export const SAVE_TEST_FLOW_REQUESTED = 'SAVE_TEST_FLOW_REQUESTED';
export const SAVE_TEST_FLOW_DONE = 'SAVE_TEST_FLOW_DONE';
export const DELETE_TEST_FLOW_REQUESTED = 'DELETE_TEST_FLOW_REQUESTED';
export const DELETE_TEST_FLOW_DONE = 'DELETE_TEST_FLOW_DONE';
export const LOAD_TEST_FLOW = 'LOAD_TEST_FLOW';
export const CREATE_NEW_TEST_FLOW = 'CREATE_NEW_TEST_FLOW';

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
export const SET_MJPEG_STATE = 'SET_MJPEG_STATE';
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

export const SET_CONTEXT = 'SET_CONTEXT';

export const SET_APP_ID = 'SET_APP_ID';
export const SET_SERVER_STATUS = 'SET_SERVER_STATUS';
export const SET_FLAT_SESSION_CAPS = 'SET_FLAT_SESSION_CAPS';

export const SET_KEEP_ALIVE_INTERVAL = 'SET_KEEP_ALIVE_INTERVAL';
export const SET_USER_WAIT_TIMEOUT = 'SET_USER_WAIT_TIMEOUT';
export const SET_LAST_ACTIVE_MOMENT = 'SET_LAST_ACTIVE_MOMENT';

export const SET_AWAITING_MJPEG_STREAM = 'SET_AWAITING_MJPEG_STREAM';

export const GESTURE_UPLOAD_REQUESTED = 'GESTURE_UPLOAD_REQUESTED';
export const GESTURE_UPLOAD_DONE = 'GESTURE_UPLOAD_DONE';
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
export const SET_REFRESHING_STATE = 'SET_REFRESHING_STATE';

export const SET_AUTO_SESSION_RESTART = 'SET_AUTO_SESSION_RESTART';

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

const TEST_FLOW_IGNORED_METHODS = new Set([
  'deleteSession',
  'getPageSource',
  'gesture',
  'getSettings',
  'status',
  'getSession',
  'getTimeouts',
  'getAppiumCommands',
  'getAppiumExtensions',
  'getElementRect',
  'switchAppiumContext',
]);

const TEST_FLOW_DRAFT_KEY = 'draft';

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

    const rankedLocators = rankSmartLocators({
      selectedElement: {...selectedElement, strategyMap},
      sourceXML,
      currentContext,
      automationName,
    });
    const smartStrategyMap = rankedLocators
      .filter(({matchCount, status}) => matchCount !== 0 && status !== 'Invalid')
      .map(({strategy, value}) => [strategy, value]);

    // Debounce find element so that if another element is selected shortly after, cancel the previous search
    await findElement(
      smartStrategyMap.length ? smartStrategyMap : strategyMap,
      dispatch,
      getState,
      path,
    );
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

/**
 * Requests a method call on appium
 */
export function applyClientMethod(params) {
  return async (dispatch, getState) => {
    const inspectorState = getState().inspector;
    const isRecording =
      params.methodName !== 'deleteSession' &&
      params.methodName !== 'getPageSource' &&
      params.methodName !== 'gesture' &&
      inspectorState.isRecording;
    const isTestFlowRecording =
      !params.skipRecord &&
      !TEST_FLOW_IGNORED_METHODS.has(params.methodName) &&
      inspectorState.isTestFlowRecording;
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
    if (isTestFlowRecording) {
      const testFlowStep = buildTestFlowActionStep(params, getState().inspector);
      if (testFlowStep) {
        dispatch({type: APPEND_TEST_FLOW_ACTION_STEP, step: testFlowStep});
      }
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
  };
}

// eslint-disable-next-line jsdoc/require-jsdoc
export function restartSession(error, params) {
  return async (dispatch, getState) => {
    if (error?.name !== UNKNOWN_ERROR) {
      showError(error, {methodName: params.methodName, secs: 10});
      return dispatch({type: METHOD_CALL_DONE});
    }
    showError(error, {methodName: params.methodName, secs: 3});
    notification.info({
      title: i18n.t('RestartSessionMessage'),
      duration: 3,
    });
    await reconnectInspectorSession(dispatch, getState);
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
export function quitSession({reason, manualQuit = true, detachOnly = false} = {}) {
  return async (dispatch, getState) => {
    const killAction = killKeepAliveLoop();
    killAction(dispatch, getState);
    if (!detachOnly) {
      const applyAction = applyClientMethod({methodName: 'deleteSession'});
      await applyAction(dispatch, getState);
    }
    dispatch({type: QUIT_SESSION_DONE});
    InspectorDriver.clearInstance(); // clear the 'cached' driver instance
    if (!manualQuit) {
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

export function startTestFlowRecording() {
  return (dispatch) => {
    dispatch({type: START_TEST_FLOW_RECORDING});
  };
}

export function pauseTestFlowRecording() {
  return (dispatch) => {
    dispatch({type: PAUSE_TEST_FLOW_RECORDING});
  };
}

export function clearTestFlow() {
  return (dispatch) => {
    dispatch({type: CLEAR_TEST_FLOW});
  };
}

export function appendTestFlowActionStep(step = {}) {
  return (dispatch) => {
    dispatch({
      type: APPEND_TEST_FLOW_ACTION_STEP,
      step: normalizeTestFlowStep('action', step),
    });
  };
}

export function appendTestFlowAssertionStep(step = {}) {
  return (dispatch) => {
    dispatch({
      type: APPEND_TEST_FLOW_ASSERTION_STEP,
      step: normalizeTestFlowStep('assertion', step),
    });
  };
}

export function appendTestFlowBranchStep(step = {}) {
  return (dispatch) => {
    dispatch({
      type: APPEND_TEST_FLOW_BRANCH_STEP,
      step: normalizeTestFlowStep('branch', step),
    });
  };
}

export function updateTestFlowStep(stepId, updates) {
  return (dispatch) => {
    dispatch({type: UPDATE_TEST_FLOW_STEP, stepId, updates});
  };
}

export function removeTestFlowStep(stepId) {
  return (dispatch) => {
    dispatch({type: REMOVE_TEST_FLOW_STEP, stepId});
  };
}

export function reorderTestFlowSteps(steps) {
  return (dispatch) => {
    dispatch({type: REORDER_TEST_FLOW_STEPS, steps});
  };
}

export function setTestFlowExportFormat(format) {
  return (dispatch) => {
    dispatch({
      type: SET_TEST_FLOW_EXPORT_FORMAT,
      format: format || TEST_FLOW_EXPORT_FORMATS.PYTEST,
    });
  };
}

export function setTestFlowStepDelayMs(stepDelayMs) {
  return (dispatch) => {
    dispatch({
      type: SET_TEST_FLOW_STEP_DELAY_MS,
      stepDelayMs: normalizeTestFlowStepDelayMs(stepDelayMs),
    });
  };
}

export function clearTestFlowPytestOutput(flowKey = null) {
  return (dispatch) => {
    dispatch({type: CLEAR_TEST_FLOW_PYTEST_OUTPUT, flowKey});
  };
}

export function runTestFlowCurrentSession(runConfigOrSteps, stepDelayMs) {
  return async (dispatch, getState) => {
    const run = buildTestFlowRunContext({
      mode: 'currentSession',
      ...(Array.isArray(runConfigOrSteps)
        ? {steps: runConfigOrSteps, stepDelayMs}
        : runConfigOrSteps),
    });

    dispatch({type: RUN_TEST_FLOW_CURRENT_SESSION_REQUESTED, run});

    try {
      await executeCurrentSessionStepSequence(run.steps, run.stepDelayMs, dispatch, getState, {
        runId: run.id,
      });
      await refreshInspectorAfterCurrentSessionRun(dispatch, getState);
      dispatch({
        type: RUN_TEST_FLOW_CURRENT_SESSION_COMPLETED,
        runId: run.id,
        result: {
          ok: true,
          exitCode: 0,
          failedStepIndex: null,
          failedStepName: null,
          errorReason: null,
        },
      });
    } catch (err) {
      await refreshInspectorAfterCurrentSessionRun(dispatch, getState);

      const failure = {
        ok: false,
        exitCode: 1,
        failedStepIndex: err?.failedStepIndex ?? null,
        failedStepName: err?.failedStepName ?? null,
        errorReason: err?.errorReason || err?.message || String(err),
      };

      dispatch({
        type: APPEND_TEST_FLOW_CURRENT_SESSION_OUTPUT,
        runId: run.id,
        chunk:
          `\n[current-session] Failed${failure.failedStepIndex ? ` at step ${failure.failedStepIndex}` : ''}: ` +
          `${failure.failedStepName || 'Unknown step'}\n${failure.errorReason}\n`,
      });
      dispatch({type: RUN_TEST_FLOW_CURRENT_SESSION_COMPLETED, runId: run.id, result: failure});
    }
  };
}

export function exportTestFlowPytestFile(code, suggestedName) {
  return async (dispatch) => {
    dispatch({type: EXPORT_TEST_FLOW_PYTEST_REQUESTED});
    try {
      const result = await exportPytestFile({code, suggestedName});
      if (result.cancelled) {
        dispatch({type: EXPORT_TEST_FLOW_PYTEST_COMPLETED, cancelled: true});
      } else {
        dispatch({
          type: EXPORT_TEST_FLOW_PYTEST_COMPLETED,
          cancelled: false,
          filePath: result.filePath,
        });
      }
    } catch (err) {
      dispatch({
        type: EXPORT_TEST_FLOW_PYTEST_FAILED,
        error: err?.message || String(err),
      });
    }
  };
}

export function runTestFlowPytest(runConfigOrCode, suggestedName) {
  return async (dispatch, getState) => {
    const run = buildTestFlowRunContext({
      mode: 'pytest',
      ...(typeof runConfigOrCode === 'string'
        ? {code: runConfigOrCode, suggestedName}
        : runConfigOrCode),
    });

    dispatch({type: RUN_TEST_FLOW_PYTEST_REQUESTED, run});
    const shouldReconnectInspector = shouldReconnectInspectorAfterPytest(getState());
    const unsubscribe = onPytestLog((chunk) => {
      dispatch({type: APPEND_TEST_FLOW_PYTEST_OUTPUT, runId: run.id, chunk});
    });
    try {
      const result = await runPytestFile({code: run.code, suggestedName: run.suggestedName});
      const sections = [];
      if (result.command) {
        sections.push(['[command]', result.command].join('\n'));
      }
      if (result.filePath) {
        sections.push(['[file]', result.filePath].join('\n'));
      }
      if (result.stdout) {
        sections.push(['[stdout]', result.stdout.trim()].join('\n'));
      }
      if (result.stderr || result.error) {
        sections.push(['[stderr]', (result.stderr || result.error || '').trim()].join('\n'));
      }
      const output = sections.filter(Boolean).join('\n\n').trim();
      dispatch({
        type: RUN_TEST_FLOW_PYTEST_COMPLETED,
        runId: run.id,
        result: {
          ...result,
          output,
        },
      });

      if (shouldReconnectInspector && result.command) {
        dispatch({
          type: APPEND_TEST_FLOW_PYTEST_OUTPUT,
          runId: run.id,
          chunk: '\n\n[inspector]\nReconnecting Inspector session after pytest run...\n',
        });
        await reconnectInspectorSession(dispatch, getState);
      }
    } catch (err) {
      dispatch({
        type: RUN_TEST_FLOW_PYTEST_FAILED,
        runId: run.id,
        error: err?.message || String(err),
      });
    } finally {
      unsubscribe();
    }
  };
}

async function executeCurrentSessionStepSequence(
  steps,
  stepDelayMs,
  dispatch,
  getState,
  context = {},
) {
  for (let index = 0; index < steps.length; index++) {
    const step = steps[index];
    const topLevelStepIndex = context.topLevelStepIndex || index + 1;
    const isTopLevelStep = !context.topLevelStepIndex;
    const stepLabel = getTestFlowStepLabel(step);
    const prefix = context.logPrefix || '[current-session]';

    dispatch({
      type: APPEND_TEST_FLOW_CURRENT_SESSION_OUTPUT,
      runId: context.runId,
      chunk: `${prefix} Step ${topLevelStepIndex}: ${stepLabel}\n`,
    });

    try {
      await executeCurrentSessionStep(step, dispatch, getState, topLevelStepIndex, stepDelayMs, {
        runId: context.runId,
      });
      dispatch({
        type: APPEND_TEST_FLOW_CURRENT_SESSION_OUTPUT,
        runId: context.runId,
        chunk: `${prefix} Step ${topLevelStepIndex}: passed\n`,
      });
    } catch (err) {
      const stepError = new Error(err?.errorReason || err?.message || String(err));
      Object.assign(stepError, {
        failedStepIndex: topLevelStepIndex,
        failedStepName: stepLabel,
        errorReason: err?.errorReason || err?.message || String(err),
      });
      throw stepError;
    }

    if (stepDelayMs > 0 && index < steps.length - 1) {
      dispatch({
        type: APPEND_TEST_FLOW_CURRENT_SESSION_OUTPUT,
        runId: context.runId,
        chunk: `${prefix} Waiting ${stepDelayMs}ms before next step\n`,
      });
      await waitForTestFlowDelay(stepDelayMs);
    }

    if (isTopLevelStep) {
      dispatch({
        type: APPEND_TEST_FLOW_CURRENT_SESSION_OUTPUT,
        runId: context.runId,
        chunk: '\n',
      });
    }
  }
}

async function executeCurrentSessionStep(
  step,
  dispatch,
  getState,
  topLevelStepIndex,
  stepDelayMs,
  context = {},
) {
  if (step.type === 'assertion') {
    await executeCurrentSessionAssertion(step, dispatch, getState);
    return;
  }

  if (step.type === 'branch') {
    const branchConditionPassed = await evaluateCurrentSessionBranchCondition(
      step,
      dispatch,
      getState,
    );
    const branchSteps = branchConditionPassed ? step.thenSteps || [] : step.elseSteps || [];
    dispatch({
      type: APPEND_TEST_FLOW_CURRENT_SESSION_OUTPUT,
      runId: context.runId,
      chunk: `[current-session] Branch selected: ${branchConditionPassed ? 'then' : 'else'}\n`,
    });
    await executeCurrentSessionStepSequence(branchSteps, stepDelayMs, dispatch, getState, {
      topLevelStepIndex,
      logPrefix: '[current-session][branch]',
      runId: context.runId,
    });
    return;
  }

  await executeCurrentSessionAction(step, dispatch, getState);
}

async function executeCurrentSessionAction(step, dispatch, getState) {
  switch (step.action) {
    case 'tap': {
      const elementId = await resolveCurrentSessionElementId(step.locator, dispatch, getState);
      await callClientMethod({
        methodName: 'elementClick',
        elementId,
        skipRefresh: true,
        skipRecord: true,
      })(dispatch, getState);
      return;
    }

    case 'sendKeys': {
      const elementId = await resolveCurrentSessionElementId(step.locator, dispatch, getState);
      await callClientMethod({
        methodName: 'elementSendKeys',
        elementId,
        args: [step.value || ''],
        skipRefresh: true,
        skipRecord: true,
      })(dispatch, getState);
      return;
    }

    case 'clear': {
      const elementId = await resolveCurrentSessionElementId(step.locator, dispatch, getState);
      await callClientMethod({
        methodName: 'elementClear',
        elementId,
        skipRefresh: true,
        skipRecord: true,
      })(dispatch, getState);
      return;
    }

    case 'scrollViewport': {
      await performCurrentSessionViewportScroll(step.direction, getState);
      return;
    }

    case 'back':
    case 'pressBack':
      await callClientMethod({methodName: 'back', skipRefresh: true, skipRecord: true})(
        dispatch,
        getState,
      );
      return;

    case 'pressHome':
      await callClientMethod({
        methodName: 'executeScript',
        args: ['mobile: pressButton', [{name: 'home'}]],
        skipRefresh: true,
        skipRecord: true,
      })(dispatch, getState);
      return;

    case 'openAppSwitcher':
      await callClientMethod({
        methodName: 'executeScript',
        args: ['mobile: pressKey', [{keycode: 187}]],
        skipRefresh: true,
        skipRecord: true,
      })(dispatch, getState);
      return;

    default:
      throw new Error(`Unsupported current-session action '${step.action || 'custom'}'`);
  }
}

async function executeCurrentSessionAssertion(step, _dispatch, getState) {
  switch (step.assertion) {
    case 'exists': {
      const elements = await findCurrentSessionElements(step.locator, getState);
      if (!elements.length) {
        throw new Error('Expected element to exist');
      }
      return;
    }

    case 'visible': {
      const elementId = await resolveCurrentSessionElementId(step.locator, _dispatch, getState);
      if (!(await getState().inspector.driver.isElementDisplayed(elementId))) {
        throw new Error('Expected element to be visible');
      }
      return;
    }

    case 'enabled': {
      const elementId = await resolveCurrentSessionElementId(step.locator, _dispatch, getState);
      if (!(await getState().inspector.driver.isElementEnabled(elementId))) {
        throw new Error('Expected element to be enabled');
      }
      return;
    }

    case 'disabled': {
      const elementId = await resolveCurrentSessionElementId(step.locator, _dispatch, getState);
      if (await getState().inspector.driver.isElementEnabled(elementId)) {
        throw new Error('Expected element to be disabled');
      }
      return;
    }

    case 'textEquals': {
      const elementId = await resolveCurrentSessionElementId(step.locator, _dispatch, getState);
      const actualText = await getState().inspector.driver.getElementText(elementId);
      if (actualText !== (step.expectedText || '')) {
        throw new Error(`Expected text '${step.expectedText || ''}' but received '${actualText}'`);
      }
      return;
    }

    case 'attributeEquals': {
      const elementId = await resolveCurrentSessionElementId(step.locator, _dispatch, getState);
      const actualValue = await getState().inspector.driver.getElementAttribute(
        elementId,
        step.attributeName || '',
      );
      if (actualValue !== (step.expectedValue || '')) {
        throw new Error(
          `Expected attribute '${step.attributeName || ''}' to equal '${step.expectedValue || ''}' but received '${actualValue}'`,
        );
      }
      return;
    }

    default:
      throw new Error(`Unsupported assertion '${step.assertion || 'exists'}'`);
  }
}

async function evaluateCurrentSessionBranchCondition(step, _dispatch, getState) {
  const conditionLocator = step.condition?.locator || step.locator;
  const conditionType = step.condition?.assertion || 'exists';

  switch (conditionType) {
    case 'exists': {
      const elements = await findCurrentSessionElements(conditionLocator, getState);
      return elements.length > 0;
    }

    case 'visible': {
      const elementId = await resolveCurrentSessionElementId(conditionLocator, _dispatch, getState).catch(
        () => null,
      );
      if (!elementId) {
        return false;
      }
      return await getState().inspector.driver.isElementDisplayed(elementId);
    }

    default:
      throw new Error(`Unsupported branch condition '${conditionType}'`);
  }
}

async function resolveCurrentSessionElementId(locator, dispatch, getState) {
  if (!locator?.strategy || !locator?.value) {
    throw new Error('Step is missing a valid locator');
  }

  const result = await callClientMethod({
    strategy: locator.strategy,
    selector: locator.value,
    skipRefresh: true,
    skipRecord: true,
  })(dispatch, getState);

  if (!result?.elementId) {
    throw new Error(`Element not found for locator ${locator.strategy} = ${locator.value}`);
  }

  return result.elementId;
}

async function findCurrentSessionElement(locator, getState) {
  if (!locator?.strategy || !locator?.value) {
    throw new Error('Step is missing a valid locator');
  }

  return await getState().inspector.driver.findElement(locator.strategy, locator.value);
}

async function findCurrentSessionElements(locator, getState) {
  if (!locator?.strategy || !locator?.value) {
    throw new Error('Step is missing a valid locator');
  }

  return await getState().inspector.driver.findElements(locator.strategy, locator.value);
}

async function performCurrentSessionViewportScroll(direction = 'down', getState) {
  const windowRect = await getState().inspector.driver.getWindowRect();
  const ratios = getScrollRatios(direction);

  const startX = Math.round(windowRect.width * ratios.startX);
  const startY = Math.round(windowRect.height * ratios.startY);
  const endX = Math.round(windowRect.width * ratios.endX);
  const endY = Math.round(windowRect.height * ratios.endY);

  await getState().inspector.driver.performActions([
    {
      type: 'pointer',
      id: 'finger1',
      parameters: {pointerType: 'touch'},
      actions: [
        {type: 'pointerMove', duration: 0, x: startX, y: startY},
        {type: 'pointerDown', button: 0},
        {type: 'pause', duration: 200},
        {type: 'pointerMove', duration: 750, origin: 'viewport', x: endX, y: endY},
        {type: 'pointerUp', button: 0},
      ],
    },
  ]);
}

function getScrollRatios(direction = 'down') {
  switch (direction) {
    case 'up':
      return {startX: 0.5, startY: 0.3, endX: 0.5, endY: 0.75};
    case 'left':
      return {startX: 0.25, startY: 0.5, endX: 0.8, endY: 0.5};
    case 'right':
      return {startX: 0.8, startY: 0.5, endX: 0.25, endY: 0.5};
    case 'down':
    default:
      return {startX: 0.5, startY: 0.75, endX: 0.5, endY: 0.3};
  }
}

function getTestFlowStepLabel(step = {}) {
  return step.name || step.type || 'Step';
}

function waitForTestFlowDelay(delayMs) {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

async function refreshInspectorAfterCurrentSessionRun(dispatch, getState) {
  try {
    await applyClientMethod({methodName: 'getPageSource', skipRecord: true})(dispatch, getState);
  } catch {}
}

// eslint-disable-next-line jsdoc/require-jsdoc
export function getSavedTestFlows() {
  return async (dispatch) => {
    dispatch({type: GET_SAVED_TEST_FLOWS_REQUESTED});
    try {
      const savedFlows = await getSetting(SAVED_TEST_FLOWS);
      dispatch({
        type: GET_SAVED_TEST_FLOWS_DONE,
        savedFlows: (savedFlows || []).map(normalizeSavedTestFlow),
      });
    } catch (err) {
      log.error(err);
      dispatch({
        type: GET_SAVED_TEST_FLOWS_DONE,
        savedFlows: [],
      });
    }
  };
}

// eslint-disable-next-line jsdoc/require-jsdoc
export function saveTestFlow(name, steps, id = null, stepDelayMs) {
  return async (dispatch) => {
    dispatch({type: SAVE_TEST_FLOW_REQUESTED});
    try {
      const savedFlows = (await getSetting(SAVED_TEST_FLOWS)) || [];
      let nextFlows = [...savedFlows];
      let targetId = id;
      const normalizedStepDelayMs = normalizeTestFlowStepDelayMs(stepDelayMs);
      const normalizedSteps = normalizePersistedTestFlowSteps(steps);

      if (targetId) {
        // Update existing flow
        nextFlows = nextFlows.map((flow) =>
          flow.id === targetId
            ? {
                ...flow,
                name,
                steps: normalizedSteps,
                stepDelayMs: normalizedStepDelayMs,
                updatedAt: Date.now(),
              }
            : flow,
        );
      } else {
        // Save new flow
        targetId = getRandomId();
        nextFlows.push({
          id: targetId,
          name,
          steps: normalizedSteps,
          stepDelayMs: normalizedStepDelayMs,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }

      nextFlows = nextFlows.map(normalizeSavedTestFlow);

      await setSetting(SAVED_TEST_FLOWS, nextFlows);
      dispatch({
        type: SAVE_TEST_FLOW_DONE,
        savedFlows: nextFlows,
        currentTestFlowId: targetId,
        steps: normalizedSteps,
        stepDelayMs: normalizedStepDelayMs,
      });
    } catch (err) {
      log.error(err);
    }
  };
}

// eslint-disable-next-line jsdoc/require-jsdoc
export function deleteTestFlow(id) {
  return async (dispatch) => {
    dispatch({type: DELETE_TEST_FLOW_REQUESTED});
    try {
      const savedFlows = (await getSetting(SAVED_TEST_FLOWS)) || [];
      const nextFlows = savedFlows.filter((flow) => flow.id !== id);
      await setSetting(SAVED_TEST_FLOWS, nextFlows);
      dispatch({
        type: DELETE_TEST_FLOW_DONE,
        savedFlows: nextFlows,
      });
    } catch (err) {
      log.error(err);
    }
  };
}

// eslint-disable-next-line jsdoc/require-jsdoc
export function loadTestFlow(id) {
  return (dispatch, getState) => {
    const {savedTestFlows} = getState().inspector;
    const flow = savedTestFlows.find((f) => f.id === id);
    if (flow) {
      const normalizedSteps = normalizePersistedTestFlowSteps(flow.steps);
      dispatch({
        type: LOAD_TEST_FLOW,
        id,
        steps: normalizedSteps,
        stepDelayMs: normalizeTestFlowStepDelayMs(flow.stepDelayMs),
      });
    }
  };
}

// eslint-disable-next-line jsdoc/require-jsdoc
export function createNewTestFlow() {
  return (dispatch) => {
    dispatch({type: CREATE_NEW_TEST_FLOW});
  };
}

export function getSavedClientFramework() {
  return async (dispatch) => {
    let framework = await getSetting(SAVED_CLIENT_FRAMEWORK);
    dispatch({type: SET_CLIENT_FRAMEWORK, framework});
  };
}

export function setClientFramework(framework) {
  return async (dispatch) => {
    if (!CLIENT_FRAMEWORK_MAP[framework]) {
      throw new Error(i18n.t('frameworkNotSupported', {framework}));
    }
    await setSetting(SAVED_CLIENT_FRAMEWORK, framework);
    dispatch({type: SET_CLIENT_FRAMEWORK, framework});
  };
}

// eslint-disable-next-line jsdoc/require-jsdoc
export function recordAction(action, params) {
  return (dispatch) => {
    dispatch({type: RECORD_ACTION, action, params});
  };
}

// eslint-disable-next-line jsdoc/require-jsdoc
export function toggleShowBoilerplate() {
  return (dispatch, getState) => {
    const show = !getState().inspector.showBoilerplate;
    dispatch({type: SET_SHOW_BOILERPLATE, show});
  };
}
// eslint-disable-next-line jsdoc/require-jsdoc
export function setSessionDetails({serverDetails, driver, sessionCaps, appMode, isUsingMjpegMode}) {
  return (dispatch) => {
    dispatch({
      type: SET_SESSION_DETAILS,
      serverDetails,
      driver,
      sessionCaps,
      appMode,
      isUsingMjpegMode,
    });
  };
}

// eslint-disable-next-line jsdoc/require-jsdoc
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
    dispatch({type: STORE_SESSION_SETTINGS, sessionSettings});
  };
}

// eslint-disable-next-line jsdoc/require-jsdoc
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
    const isRecording = getState().inspector.isRecording;
    dispatch({type: SEARCHING_FOR_ELEMENTS});
    try {
      const callAction = callClientMethod({strategy, selector, fetchArray: true});
      let {elements, variableName, executionTime} = await callAction(dispatch, getState);
      if (isRecording) {
        const findAction = findAndAssign(strategy, selector, variableName, true);
        findAction(dispatch, getState);
      }
      elements = elements.map((el) => el.id);
      dispatch({type: SEARCHING_FOR_ELEMENTS_COMPLETED, elements, executionTime});
      return elements;
    } catch (error) {
      dispatch({type: SEARCHING_FOR_ELEMENTS_COMPLETED});
      showError(error, {methodName: 10});
      return [];
    }
  };
}

export function selectElementByLocator(strategy, selector) {
  return async (dispatch, getState) => {
    dispatch({type: SET_LOCATOR_TEST_STRATEGY, locatorTestStrategy: strategy});
    dispatch({type: SET_LOCATOR_TEST_VALUE, locatorTestValue: selector});

    const elementIds = await searchForElement(strategy, selector)(dispatch, getState);
    if (!elementIds.length) {
      return null;
    }

    const targetElementId = elementIds[0];
    await setLocatorTestElement(targetElementId)(dispatch, getState);

    const {sourceJSON, sourceXML, searchedForElementBounds} = getState().inspector;
    await selectLocatedElement(
      sourceJSON,
      sourceXML,
      searchedForElementBounds,
      targetElementId,
    )(dispatch, getState);

    return targetElementId;
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

/**
 * Validate smart locator candidates by running real Appium findElements calls.
 *
 * @param {Array<object>} locators
 * @param {string} selectedElementId
 * @returns {Function}
 */
export function validateSmartLocators(locators, selectedElementId) {
  return async (dispatch, getState) => {
    const {driver, selectedElementPath} = getState().inspector;
    dispatch({type: VALIDATE_SMART_LOCATORS_REQUESTED});
    const validationResults = {};

    for (const locator of locators) {
      const start = Date.now();
      try {
        const elements = await driver.findElements(locator.strategy, locator.value);
        const elementIds = elements.map((element) => element.elementId);
        validationResults[locator.key] = {
          key: locator.key,
          executionTime: Date.now() - start,
          matchCount: elements.length,
          elementIds,
          matchesSelectedElement: selectedElementId ? elementIds.includes(selectedElementId) : null,
        };
      } catch (error) {
        validationResults[locator.key] = {
          key: locator.key,
          executionTime: Date.now() - start,
          matchCount: 0,
          elementIds: [],
          matchesSelectedElement: false,
          error: error?.message || String(error),
        };
      }
    }

    if (getState().inspector.selectedElementPath === selectedElementPath) {
      dispatch({
        type: VALIDATE_SMART_LOCATORS_COMPLETED,
        validationResults,
      });
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
          methodName: 'getElementRect',
          skipRefresh: true,
          skipRecord: true,
        });
        const {commandRes} = await action(dispatch, getState);
        dispatch({
          type: SET_SEARCHED_FOR_ELEMENT_BOUNDS,
          location: {x: commandRes.x, y: commandRes.y},
          size: {width: commandRes.width, height: commandRes.height},
        });
      } catch {}
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
    if (!bounds || !sourceJSON.children?.[0]?.attributes) {
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

export function setMjpegState(targetMjpegState) {
  return (dispatch) => {
    dispatch({type: SET_MJPEG_STATE, targetMjpegState});
  };
}

export function selectScreenshotInteractionMode(screenshotInteractionMode) {
  return (dispatch) => {
    dispatch({type: SET_SCREENSHOT_INTERACTION_MODE, screenshotInteractionMode});
  };
}

export function setRefreshingState(refreshStates) {
  return (dispatch) => {
    dispatch({type: SET_REFRESHING_STATE, refreshStates});
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
      const action = applyClientMethod({methodName: 'switchAppiumContext', args: [NATIVE_APP]});
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
          skipRefresh: true,
        });
        const {bundleId} = await action(dispatch, getState);
        dispatch({type: SET_APP_ID, appId: bundleId});
      }
      if (isAndroid) {
        const action = applyClientMethod({
          methodName: 'executeScript',
          args: ['mobile:getCurrentPackage', []],
          skipRefresh: true,
        });
        const appPackage = await action(dispatch, getState);
        dispatch({type: SET_APP_ID, appId: appPackage});
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
    dispatch({type: SET_SERVER_STATUS, status: build});
  };
}

export function getFlatSessionCaps() {
  return async (dispatch, getState) => {
    const action = applyClientMethod({methodName: 'getSession', skipRefresh: true});
    const flatSessionCaps = await action(dispatch, getState);
    dispatch({type: SET_FLAT_SESSION_CAPS, flatSessionCaps});
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

export function getSupportedSessionMethods() {
  return async (_dispatch, getState) => {
    async function safelyCallCommand(methodName) {
      try {
        const action = executeDriverCommand({methodName});
        const {commandRes} = await action(getState);
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
      log.info('Pinging Appium server to keep session active');
      try {
        await driver.getTimeouts(); // Pings the Appium server to keep it alive
      } catch {}
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
    const {keepAliveInterval} = getState().inspector;
    clearInterval(keepAliveInterval);
    dispatch({type: SET_KEEP_ALIVE_INTERVAL, keepAliveInterval: null});
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
    const {driver, appMode, isUsingMjpegMode, isSourceRefreshOn, autoSessionRestart} =
      getState().inspector;
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
      dispatch({type: METHOD_CALL_DONE});
    }
  };
}

// Simple alternative to callClientMethod, for when we only want to
// run the command without any side-effects
export function executeDriverCommand(params) {
  return async (getState) => {
    const {driver} = getState().inspector;
    params.skipRefresh = true;
    const inspectorDriver = InspectorDriver.instance(driver);
    return await inspectorDriver.run(params);
  };
}

export function setAwaitingMjpegStream(isAwaiting) {
  return (dispatch) => {
    dispatch({type: SET_AWAITING_MJPEG_STREAM, isAwaiting});
  };
}

export function importGestureFiles(fileList) {
  return async (dispatch) => {
    dispatch({type: GESTURE_UPLOAD_REQUESTED});
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
    dispatch({type: GESTURE_UPLOAD_DONE});

    if (!_.isEmpty(invalidGestureFiles)) {
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
    const gestureToExport = _.omit(gestureJSON, ['id', 'date']);
    const href = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(gestureToExport, null, 2),
    )}`;
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

export function toggleAutoSessionRestart() {
  return (dispatch, getState) => {
    const autoSessionRestart = !getState().inspector.autoSessionRestart;
    dispatch({type: SET_AUTO_SESSION_RESTART, autoSessionRestart});
  };
}

function normalizeTestFlowStep(type, payload = {}) {
  const baseStep = {
    id: payload.id || getRandomId(),
    createdAt: payload.createdAt || Date.now(),
    type,
    ...payload,
  };

  if (type === 'branch') {
    return {
      name: 'Conditional branch',
      condition: null,
      thenSteps: [],
      elseSteps: [],
      ...baseStep,
    };
  }

  if (type === 'assertion') {
    return {
      name: 'Assertion',
      assertion: 'exists',
      ...baseStep,
    };
  }

  return {
    name: 'Recorded action',
    action: 'custom',
    ...baseStep,
  };
}

function getSelectedElementLocator(selectedElement) {
  const [strategy, value] = selectedElement?.strategyMap?.[0] || [];
  if (!strategy || !value) {
    return null;
  }
  return {strategy, value};
}

function buildExecuteScriptTestFlowAction(args = []) {
  const [scriptName, scriptArgs = []] = args;

  if (scriptName === 'mobile:pressButton' && scriptArgs?.[0]?.name === 'home') {
    return {
      action: 'pressHome',
      name: 'Press home button',
      args,
    };
  }

  if (scriptName === 'mobile:pressKey') {
    const keycode = scriptArgs?.[0]?.keycode;
    if (keycode === 4) {
      return {
        action: 'pressBack',
        name: 'Press Android back',
        args,
      };
    }
    if (keycode === 3) {
      return {
        action: 'pressHome',
        name: 'Press Android home',
        args,
      };
    }
    if (keycode === 187) {
      return {
        action: 'openAppSwitcher',
        name: 'Open app switcher',
        args,
      };
    }
  }

  return null;
}

function buildTestFlowActionStep(params, inspectorState) {
  const locator =
    params.strategy && params.selector
      ? {strategy: params.strategy, value: params.selector}
      : getSelectedElementLocator(inspectorState.selectedElement);
  const context = {
    appMode: inspectorState.appMode,
    currentContext: inspectorState.currentContext,
  };

  switch (params.methodName) {
    case 'elementClick':
      return normalizeTestFlowStep('action', {
        name: 'Tap element',
        action: 'tap',
        locator,
        context,
      });

    case 'elementSendKeys':
      return normalizeTestFlowStep('action', {
        name: 'Send keys',
        action: 'sendKeys',
        locator,
        value: params.args?.[0] || '',
        context,
      });

    case 'elementClear':
      return normalizeTestFlowStep('action', {
        name: 'Clear element',
        action: 'clear',
        locator,
        context,
      });

    case 'back':
      return normalizeTestFlowStep('action', {
        name: 'Navigate back',
        action: 'back',
        context,
      });

    case 'executeScript': {
      const deviceAction = buildExecuteScriptTestFlowAction(params.args || []);
      if (!deviceAction) {
        return null;
      }
      return normalizeTestFlowStep('action', {
        ...deviceAction,
        context,
      });
    }

    default:
      return null;
  }
}

function normalizeSavedTestFlow(flow = {}) {
  return {
    ...flow,
    steps: normalizePersistedTestFlowSteps(flow.steps),
    stepDelayMs: normalizeTestFlowStepDelayMs(flow.stepDelayMs),
  };
}

function normalizePersistedTestFlowSteps(steps = []) {
  if (!Array.isArray(steps)) {
    return [];
  }

  return steps.map((step) => normalizePersistedTestFlowStep(step));
}

function normalizePersistedTestFlowStep(step = {}) {
  const normalizedStep = normalizeTestFlowStep(step.type || 'action', step);

  if (normalizedStep.type === 'branch') {
    return {
      ...normalizedStep,
      thenSteps: normalizePersistedTestFlowSteps(normalizedStep.thenSteps),
      elseSteps: normalizePersistedTestFlowSteps(normalizedStep.elseSteps),
    };
  }

  return normalizedStep;
}

function buildTestFlowRunContext({
  mode,
  flowId = null,
  flowName = 'Draft Flow',
  steps = [],
  stepDelayMs = 0,
  code = '',
  suggestedName = null,
} = {}) {
  return {
    id: getRandomId(),
    mode,
    flowId,
    flowKey: flowId || TEST_FLOW_DRAFT_KEY,
    flowName,
    startedAt: Date.now(),
    stepDelayMs: normalizeTestFlowStepDelayMs(stepDelayMs),
    steps: normalizePersistedTestFlowSteps(steps),
    code,
    suggestedName,
  };
}

function shouldReconnectInspectorAfterPytest(state) {
  return Boolean(state?.inspector?.driver) && state?.inspector?.automationName === 'uiautomator2';
}

async function reconnectInspectorSession(dispatch, getState) {
  const caps = getState().builder?.caps;
  if (!caps || _.isEmpty(caps)) {
    return false;
  }

  const quitSes = quitSession();
  const newSes = newSession(caps);
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
  dispatch({type: SET_AUTO_SESSION_RESTART, autoSessionRestart: true});
  dispatch({type: METHOD_CALL_DONE});
  return true;
}

function parseAndValidateGestureFileString(gestureFileString) {
  const gestureJSON = parseGestureFileContents(gestureFileString);
  if (gestureJSON === null) {
    return null;
  }
  return _.omit(gestureJSON, ['id', 'date']);
}
