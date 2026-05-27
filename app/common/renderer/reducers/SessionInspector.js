import _ from 'lodash';

import {DEFAULT_TEST_FLOW_STEP_DELAY_MS} from '../lib/test-flow-recorder/common.js';
import {
  ADD_ASSIGNED_VAR_CACHE,
  APPEND_TEST_FLOW_ACTION_STEP,
  APPEND_TEST_FLOW_ASSERTION_STEP,
  APPEND_TEST_FLOW_BRANCH_STEP,
  APPEND_TEST_FLOW_CURRENT_SESSION_OUTPUT,
  APPEND_TEST_FLOW_PYTEST_OUTPUT,
  CLEAR_ASSIGNED_VAR_CACHE,
  CLEAR_COORD_ACTION,
  CLEAR_RECORDING,
  CLEAR_SEARCH_RESULTS,
  CLEAR_SEARCHED_FOR_ELEMENT_BOUNDS,
  CLEAR_TAP_COORDINATES,
  CLEAR_TEST_FLOW,
  CLEAR_TEST_FLOW_PYTEST_OUTPUT,
  CREATE_NEW_TEST_FLOW,
  DELETE_SAVED_GESTURES_DONE,
  DELETE_SAVED_GESTURES_REQUESTED,
  DELETE_TEST_FLOW_DONE,
  EXPORT_TEST_FLOW_PYTEST_COMPLETED,
  EXPORT_TEST_FLOW_PYTEST_FAILED,
  EXPORT_TEST_FLOW_PYTEST_REQUESTED,
  FINDING_ELEMENT_IN_SOURCE,
  FINDING_ELEMENT_IN_SOURCE_COMPLETED,
  GESTURE_UPLOAD_DONE,
  GESTURE_UPLOAD_REQUESTED,
  GET_FIND_ELEMENTS_TIMES,
  GET_FIND_ELEMENTS_TIMES_COMPLETED,
  GET_SAVED_GESTURES_DONE,
  GET_SAVED_GESTURES_REQUESTED,
  GET_SAVED_TEST_FLOWS_DONE,
  HIDE_GESTURE_ACTION,
  HIDE_GESTURE_EDITOR,
  HIDE_LOCATOR_TEST_MODAL,
  HIDE_PROMPT_KEEP_ALIVE,
  HIDE_SIRI_COMMAND_MODAL,
  LOAD_TEST_FLOW,
  METHOD_CALL_DONE,
  METHOD_CALL_REQUESTED,
  PAUSE_RECORDING,
  PAUSE_TEST_FLOW_RECORDING,
  PROMPT_KEEP_ALIVE,
  QUIT_SESSION_DONE,
  QUIT_SESSION_REQUESTED,
  RECORD_ACTION,
  REMOVE_LOADED_GESTURE,
  REMOVE_TEST_FLOW_STEP,
  REORDER_TEST_FLOW_STEPS,
  RUN_TEST_FLOW_CURRENT_SESSION_COMPLETED,
  RUN_TEST_FLOW_CURRENT_SESSION_FAILED,
  RUN_TEST_FLOW_CURRENT_SESSION_REQUESTED,
  RUN_TEST_FLOW_PYTEST_COMPLETED,
  RUN_TEST_FLOW_PYTEST_FAILED,
  RUN_TEST_FLOW_PYTEST_REQUESTED,
  SAVE_TEST_FLOW_DONE,
  SEARCHING_FOR_ELEMENTS,
  SEARCHING_FOR_ELEMENTS_COMPLETED,
  SELECT_CENTROID,
  SELECT_ELEMENT,
  SELECT_INSPECTOR_TAB,
  SELECT_TICK_ELEMENT,
  SESSION_DONE,
  SET_APP_ID,
  SET_APP_MODE,
  SET_AUTO_SESSION_RESTART,
  SET_AWAITING_MJPEG_STREAM,
  SET_CLIENT_FRAMEWORK,
  SET_CONTEXT,
  SET_COORD_END,
  SET_COORD_START,
  SET_EXPANDED_PATHS,
  SET_FLAT_SESSION_CAPS,
  SET_GESTURE_TAP_COORDS_MODE,
  SET_INTERACTIONS_NOT_AVAILABLE,
  SET_KEEP_ALIVE_INTERVAL,
  SET_LAST_ACTIVE_MOMENT,
  SET_LOADED_GESTURE,
  SET_LOCATOR_TEST_ELEMENT,
  SET_LOCATOR_TEST_STRATEGY,
  SET_LOCATOR_TEST_VALUE,
  SET_MJPEG_STATE,
  SET_OPTIMAL_LOCATORS,
  SET_REFRESHING_STATE,
  SET_SCREENSHOT_INTERACTION_MODE,
  SET_SEARCHED_FOR_ELEMENT_BOUNDS,
  SET_SELECTED_ELEMENT_ID,
  SET_SERVER_STATUS,
  SET_SESSION_DETAILS,
  SET_SESSION_TIME,
  SET_SHOW_BOILERPLATE,
  SET_SHOW_CENTROIDS,
  SET_SIRI_COMMAND_VALUE,
  SET_SOURCE_AND_SCREENSHOT,
  SET_TEST_FLOW_EXPORT_FORMAT,
  SET_TEST_FLOW_STEP_DELAY_MS,
  SET_USER_WAIT_TIMEOUT,
  SHOW_GESTURE_ACTION,
  SHOW_GESTURE_EDITOR,
  SHOW_LOCATOR_TEST_MODAL,
  SHOW_SIRI_COMMAND_MODAL,
  START_RECORDING,
  START_TEST_FLOW_RECORDING,
  STORE_SESSION_SETTINGS,
  TOGGLE_SHOW_ATTRIBUTES,
  UNSELECT_CENTROID,
  UNSELECT_ELEMENT,
  UNSELECT_TICK_ELEMENT,
  UPDATE_TEST_FLOW_STEP,
  VALIDATE_SMART_LOCATORS_COMPLETED,
  VALIDATE_SMART_LOCATORS_REQUESTED,
} from '../actions/SessionInspector.js';
import {SCREENSHOT_INTERACTION_MODE} from '../constants/screenshot.js';
import {
  APP_MODE,
  CLIENT_FRAMEWORKS,
  INSPECTOR_TABS,
  NATIVE_APP,
  TEST_FLOW_EXPORT_FORMATS,
} from '../constants/session-inspector.js';

const TEST_FLOW_DRAFT_KEY = 'draft';

function appendTestFlowRun(historyByFlowKey, run) {
  const flowKey = run.flowKey || TEST_FLOW_DRAFT_KEY;
  const currentRuns = historyByFlowKey[flowKey] || [];
  return {
    ...historyByFlowKey,
    [flowKey]: [run, ...currentRuns.filter(({id}) => id !== run.id)],
  };
}

function updateTestFlowRun(historyByFlowKey, runId, updater) {
  if (!runId) {
    return historyByFlowKey;
  }

  let hasUpdated = false;
  const nextHistory = Object.fromEntries(
    Object.entries(historyByFlowKey).map(([flowKey, runs]) => [
      flowKey,
      runs.map((run) => {
        if (run.id !== runId) {
          return run;
        }

        hasUpdated = true;
        return updater(run);
      }),
    ]),
  );

  return hasUpdated ? nextHistory : historyByFlowKey;
}

function clearTestFlowRunHistory(historyByFlowKey, flowKey) {
  if (!flowKey) {
    return {};
  }

  if (!historyByFlowKey[flowKey]) {
    return historyByFlowKey;
  }

  const nextHistory = {...historyByFlowKey};
  delete nextHistory[flowKey];
  return nextHistory;
}

const INITIAL_STATE = {
  savedGestures: [],
  driver: null,
  automationName: null,
  keepAliveInterval: null,
  showKeepAlivePrompt: false,
  userWaitTimeout: null,
  lastActiveMoment: null,
  expandedPaths: ['0'],
  isRecording: false,
  isTestFlowRecording: false,
  isSourceRefreshOn: true,
  showBoilerplate: false,
  recordedActions: [],
  recordedTestFlowSteps: [],
  savedTestFlows: [],
  currentTestFlowId: null,
  testFlowExportFormat: TEST_FLOW_EXPORT_FORMATS.PYTEST,
  testFlowStepDelayMs: DEFAULT_TEST_FLOW_STEP_DELAY_MS,
  isRunningTestFlowCurrentSession: false,
  isExportingTestFlowPytest: false,
  isRunningTestFlowPytest: false,
  testFlowLastRunMode: null,
  testFlowCurrentSessionExitCode: null,
  testFlowCurrentSessionLastRunAt: null,
  testFlowCurrentSessionOutput: '',
  testFlowCurrentSessionResult: null,
  testFlowExportFilePath: null,
  testFlowPytestCommand: null,
  testFlowPytestExitCode: null,
  testFlowPytestFilePath: null,
  testFlowPytestLastRunAt: null,
  testFlowPytestOutput: '',
  testFlowCurrentRunId: null,
  testFlowRunHistoryByFlowKey: {},
  testFlowRuntimeError: null,
  clientFramework: CLIENT_FRAMEWORKS.JAVA_JUNIT4,
  serverDetails: {},
  sessionCaps: {},
  sessionSettings: {},
  isGestureEditorVisible: false,
  isLocatorTestModalVisible: false,
  isSiriCommandModalVisible: false,
  siriCommandValue: '',
  showCentroids: false,
  locatorTestStrategy: 'id',
  locatorTestValue: '',
  isSearchingForElements: false,
  assignedVarCache: {},
  screenshotInteractionMode: SCREENSHOT_INTERACTION_MODE.SELECT,
  searchedForElementBounds: null,
  selectedInspectorTab: INSPECTOR_TABS.SOURCE,
  appMode: APP_MODE.NATIVE,
  findElementsExecutionTimes: [],
  isFindingElementsTimes: false,
  isFindingLocatedElementInSource: false,
  isAwaitingMjpegStream: true,
  showSourceAttrs: false,
  isUploadingGestureFiles: false,
  autoSessionRestart: false,
};

let nextState;

export default function inspector(state = INITIAL_STATE, action) {
  switch (action.type) {
    case SET_SOURCE_AND_SCREENSHOT:
      return {
        ...state,
        contexts: action.contexts,
        contextsError: action.contextsError,
        currentContext: action.currentContext || NATIVE_APP,
        currentContextError: action.currentContextError,
        sourceJSON: action.sourceJSON,
        sourceXML: action.sourceXML,
        sourceError: action.sourceError,
        screenshot: action.screenshot,
        screenshotError: action.screenshotError,
        windowSize: action.windowSize,
        windowSizeError: action.windowSizeError,
        findElementsExecutionTimes: [],
      };

    case QUIT_SESSION_REQUESTED:
      return {
        ...state,
        methodCallInProgress: true,
        isQuittingSession: true,
      };

    case QUIT_SESSION_DONE:
      return {
        ...INITIAL_STATE,
      };

    case SESSION_DONE:
      return {
        ...state,
        isSessionDone: true,
        methodCallInProgress: false,
      };

    case SELECT_ELEMENT:
      return {
        ...state,
        selectedElement: action.selectedElement,
        selectedElementPath: action.selectedElement.path,
        selectedElementId: null,
        selectedElementSearchInProgress: true,
        elementInteractionsNotAvailable: false,
        findElementsExecutionTimes: [],
        smartLocatorRuntimeValidationResults: {},
      };

    case SET_OPTIMAL_LOCATORS:
      return {
        ...state,
        selectedElement: {
          ...state.selectedElement,
          strategyMap: action.strategyMap,
        },
      };

    case UNSELECT_ELEMENT:
      return {
        ...state,
        selectedElement: undefined,
        selectedElementPath: null,
        selectedElementId: null,
        selectedElementSearchInProgress: false,
        isValidatingSmartLocators: false,
        smartLocatorRuntimeValidationResults: {},
      };

    case SELECT_CENTROID:
      return {
        ...state,
        selectedCentroid: action.path,
      };

    case UNSELECT_CENTROID:
      return _.omit(state, 'selectedCentroid');

    case SET_SELECTED_ELEMENT_ID:
      return {
        ...state,
        selectedElementId: action.elementId,
        selectedElementSearchInProgress: false,
        findElementsExecutionTimes: [],
      };

    case VALIDATE_SMART_LOCATORS_REQUESTED:
      return {
        ...state,
        isValidatingSmartLocators: true,
      };

    case VALIDATE_SMART_LOCATORS_COMPLETED:
      return {
        ...state,
        isValidatingSmartLocators: false,
        smartLocatorRuntimeValidationResults: action.validationResults,
      };

    case SET_INTERACTIONS_NOT_AVAILABLE:
      return {
        ...state,
        elementInteractionsNotAvailable: true,
        selectedElementSearchInProgress: false,
      };

    case METHOD_CALL_REQUESTED:
      return {
        ...state,
        methodCallInProgress: true,
      };

    case METHOD_CALL_DONE:
      return {
        ...state,
        methodCallInProgress: false,
      };

    case SET_EXPANDED_PATHS:
      return {
        ...state,
        expandedPaths: action.paths,
        findElementsExecutionTimes: [],
      };

    case START_RECORDING:
      return {
        ...state,
        isRecording: true,
      };

    case PAUSE_RECORDING:
      return {
        ...state,
        isRecording: false,
      };

    case CLEAR_RECORDING:
      return {
        ...state,
        recordedActions: [],
      };

    case START_TEST_FLOW_RECORDING:
      return {
        ...state,
        isTestFlowRecording: true,
      };

    case PAUSE_TEST_FLOW_RECORDING:
      return {
        ...state,
        isTestFlowRecording: false,
      };

    case CLEAR_TEST_FLOW:
      return {
        ...state,
        recordedTestFlowSteps: [],
      };

    case APPEND_TEST_FLOW_ACTION_STEP:
    case APPEND_TEST_FLOW_ASSERTION_STEP:
    case APPEND_TEST_FLOW_BRANCH_STEP:
      return {
        ...state,
        recordedTestFlowSteps: [...state.recordedTestFlowSteps, action.step],
      };

    case UPDATE_TEST_FLOW_STEP:
      return {
        ...state,
        recordedTestFlowSteps: state.recordedTestFlowSteps.map((step) =>
          step.id === action.stepId ? {...step, ...action.updates} : step,
        ),
      };

    case REMOVE_TEST_FLOW_STEP:
      return {
        ...state,
        recordedTestFlowSteps: state.recordedTestFlowSteps.filter(({id}) => id !== action.stepId),
      };

    case REORDER_TEST_FLOW_STEPS:
      return {
        ...state,
        recordedTestFlowSteps: action.steps || state.recordedTestFlowSteps,
      };

    case GET_SAVED_TEST_FLOWS_DONE:
      return {
        ...state,
        savedTestFlows: action.savedFlows,
      };

    case SAVE_TEST_FLOW_DONE:
      return {
        ...state,
        savedTestFlows: action.savedFlows,
        currentTestFlowId: action.currentTestFlowId,
        recordedTestFlowSteps: action.steps || state.recordedTestFlowSteps,
        testFlowStepDelayMs: action.stepDelayMs ?? state.testFlowStepDelayMs,
      };

    case DELETE_TEST_FLOW_DONE: {
      const isCurrentDeleted =
        state.currentTestFlowId &&
        !action.savedFlows.some((flow) => flow.id === state.currentTestFlowId);
      return {
        ...state,
        savedTestFlows: action.savedFlows,
        ...(isCurrentDeleted
          ? {
              currentTestFlowId: null,
              recordedTestFlowSteps: [],
              testFlowStepDelayMs: DEFAULT_TEST_FLOW_STEP_DELAY_MS,
            }
          : {}),
      };
    }

    case LOAD_TEST_FLOW:
      return {
        ...state,
        currentTestFlowId: action.id,
        recordedTestFlowSteps: action.steps,
        testFlowStepDelayMs: action.stepDelayMs ?? DEFAULT_TEST_FLOW_STEP_DELAY_MS,
      };

    case CREATE_NEW_TEST_FLOW:
      return {
        ...state,
        currentTestFlowId: null,
        recordedTestFlowSteps: [],
        testFlowStepDelayMs: DEFAULT_TEST_FLOW_STEP_DELAY_MS,
      };

    case SET_TEST_FLOW_EXPORT_FORMAT:
      return {
        ...state,
        testFlowExportFormat: action.format || TEST_FLOW_EXPORT_FORMATS.PYTEST,
      };

    case SET_TEST_FLOW_STEP_DELAY_MS:
      return {
        ...state,
        testFlowStepDelayMs: action.stepDelayMs,
      };

    case CLEAR_TEST_FLOW_PYTEST_OUTPUT:
      return {
        ...state,
        isRunningTestFlowCurrentSession: false,
        testFlowLastRunMode: null,
        testFlowCurrentSessionExitCode: null,
        testFlowCurrentSessionLastRunAt: null,
        testFlowCurrentSessionOutput: '',
        testFlowCurrentSessionResult: null,
        testFlowPytestCommand: null,
        testFlowPytestExitCode: null,
        testFlowPytestFilePath: null,
        testFlowPytestLastRunAt: null,
        testFlowPytestOutput: '',
        testFlowCurrentRunId:
          !action.flowKey ||
          state.testFlowRunHistoryByFlowKey[action.flowKey]?.some(
            ({id}) => id === state.testFlowCurrentRunId,
          )
            ? null
            : state.testFlowCurrentRunId,
        testFlowRunHistoryByFlowKey: clearTestFlowRunHistory(
          state.testFlowRunHistoryByFlowKey,
          action.flowKey,
        ),
        testFlowRuntimeError: null,
      };

    case RUN_TEST_FLOW_CURRENT_SESSION_REQUESTED: {
      const run = {
        ...action.run,
        status: 'running',
        exitCode: null,
        output: '',
        result: null,
        command: null,
        filePath: null,
        completedAt: null,
        error: null,
      };
      return {
        ...state,
        isRunningTestFlowCurrentSession: true,
        testFlowLastRunMode: 'currentSession',
        testFlowCurrentSessionExitCode: null,
        testFlowCurrentSessionLastRunAt: null,
        testFlowCurrentSessionOutput: '',
        testFlowCurrentSessionResult: null,
        testFlowCurrentRunId: run.id,
        testFlowRunHistoryByFlowKey: appendTestFlowRun(state.testFlowRunHistoryByFlowKey, run),
        testFlowRuntimeError: null,
      };
    }

    case APPEND_TEST_FLOW_CURRENT_SESSION_OUTPUT: {
      const runId = action.runId || state.testFlowCurrentRunId;
      return {
        ...state,
        testFlowCurrentSessionOutput: (state.testFlowCurrentSessionOutput || '') + action.chunk,
        testFlowRunHistoryByFlowKey: updateTestFlowRun(
          state.testFlowRunHistoryByFlowKey,
          runId,
          (run) => ({
            ...run,
            output: (run.output || '') + action.chunk,
          }),
        ),
      };
    }

    case RUN_TEST_FLOW_CURRENT_SESSION_COMPLETED: {
      const runId = action.runId || state.testFlowCurrentRunId;
      return {
        ...state,
        isRunningTestFlowCurrentSession: false,
        testFlowLastRunMode: 'currentSession',
        testFlowCurrentSessionExitCode: action.result?.exitCode,
        testFlowCurrentSessionLastRunAt: Date.now(),
        testFlowCurrentSessionResult: action.result || null,
        testFlowRunHistoryByFlowKey: updateTestFlowRun(
          state.testFlowRunHistoryByFlowKey,
          runId,
          (run) => ({
            ...run,
            status: action.result?.ok ? 'passed' : 'failed',
            exitCode: action.result?.exitCode,
            result: action.result || null,
            error: action.result?.ok ? null : action.result?.errorReason || null,
            completedAt: Date.now(),
          }),
        ),
        testFlowRuntimeError: action.result?.ok ? null : action.result?.errorReason || null,
      };
    }

    case RUN_TEST_FLOW_CURRENT_SESSION_FAILED: {
      const runId = action.runId || state.testFlowCurrentRunId;
      return {
        ...state,
        isRunningTestFlowCurrentSession: false,
        testFlowLastRunMode: 'currentSession',
        testFlowCurrentSessionExitCode: 1,
        testFlowCurrentSessionLastRunAt: Date.now(),
        testFlowCurrentSessionResult: action.result || null,
        testFlowRunHistoryByFlowKey: updateTestFlowRun(
          state.testFlowRunHistoryByFlowKey,
          runId,
          (run) => ({
            ...run,
            status: 'failed',
            exitCode: 1,
            error: action.error,
            output: action.error || run.output || '',
            completedAt: Date.now(),
          }),
        ),
        testFlowRuntimeError: action.error,
      };
    }

    case EXPORT_TEST_FLOW_PYTEST_REQUESTED:
      return {
        ...state,
        isExportingTestFlowPytest: true,
        testFlowRuntimeError: null,
      };

    case EXPORT_TEST_FLOW_PYTEST_COMPLETED:
      return {
        ...state,
        isExportingTestFlowPytest: false,
        testFlowExportFilePath: action.cancelled ? state.testFlowExportFilePath : action.filePath,
      };

    case EXPORT_TEST_FLOW_PYTEST_FAILED:
      return {
        ...state,
        isExportingTestFlowPytest: false,
        testFlowRuntimeError: action.error,
      };

    case RUN_TEST_FLOW_PYTEST_REQUESTED: {
      const run = {
        ...action.run,
        status: 'running',
        exitCode: null,
        output: '',
        result: null,
        command: null,
        filePath: null,
        completedAt: null,
        error: null,
      };
      return {
        ...state,
        isRunningTestFlowPytest: true,
        testFlowLastRunMode: 'pytest',
        testFlowPytestCommand: null,
        testFlowPytestExitCode: null,
        testFlowPytestFilePath: null,
        testFlowPytestOutput: '',
        testFlowCurrentRunId: run.id,
        testFlowRunHistoryByFlowKey: appendTestFlowRun(state.testFlowRunHistoryByFlowKey, run),
        testFlowRuntimeError: null,
      };
    }

    case APPEND_TEST_FLOW_PYTEST_OUTPUT: {
      const runId = action.runId || state.testFlowCurrentRunId;
      return {
        ...state,
        testFlowPytestOutput: (state.testFlowPytestOutput || '') + action.chunk,
        testFlowRunHistoryByFlowKey: updateTestFlowRun(
          state.testFlowRunHistoryByFlowKey,
          runId,
          (run) => ({
            ...run,
            output: (run.output || '') + action.chunk,
          }),
        ),
      };
    }

    case RUN_TEST_FLOW_PYTEST_COMPLETED: {
      const runId = action.runId || state.testFlowCurrentRunId;
      return {
        ...state,
        isRunningTestFlowPytest: false,
        testFlowLastRunMode: 'pytest',
        testFlowPytestCommand: action.result?.command || null,
        testFlowPytestExitCode: action.result?.exitCode,
        testFlowPytestFilePath: action.result?.filePath || null,
        testFlowPytestLastRunAt: Date.now(),
        testFlowPytestOutput: action.result?.output || '',
        testFlowRunHistoryByFlowKey: updateTestFlowRun(
          state.testFlowRunHistoryByFlowKey,
          runId,
          (run) => ({
            ...run,
            status: action.result?.ok ? 'passed' : 'failed',
            exitCode: action.result?.exitCode,
            output: action.result?.output || run.output || '',
            result: action.result || null,
            command: action.result?.command || null,
            filePath: action.result?.filePath || null,
            error: action.result?.ok ? null : action.result?.stderr || null,
            completedAt: Date.now(),
          }),
        ),
        testFlowRuntimeError: action.result?.ok ? null : action.result?.stderr || null,
      };
    }

    case RUN_TEST_FLOW_PYTEST_FAILED: {
      const runId = action.runId || state.testFlowCurrentRunId;
      return {
        ...state,
        isRunningTestFlowPytest: false,
        testFlowLastRunMode: 'pytest',
        testFlowPytestLastRunAt: Date.now(),
        testFlowPytestOutput: action.error,
        testFlowRunHistoryByFlowKey: updateTestFlowRun(
          state.testFlowRunHistoryByFlowKey,
          runId,
          (run) => ({
            ...run,
            status: 'failed',
            exitCode: 1,
            output: action.error,
            error: action.error,
            completedAt: Date.now(),
          }),
        ),
        testFlowRuntimeError: action.error,
      };
    }

    case SET_CLIENT_FRAMEWORK:
      return {
        ...state,
        clientFramework: action.framework,
      };

    case RECORD_ACTION:
      return {
        ...state,
        recordedActions: [...state.recordedActions, {action: action.action, params: action.params}],
      };

    case ADD_ASSIGNED_VAR_CACHE:
      return {
        ...state,
        assignedVarCache: {
          ...state.assignedVarCache,
          [action.varName]: true,
        },
      };

    case CLEAR_ASSIGNED_VAR_CACHE:
      return {
        ...state,
        assignedVarCache: [],
      };

    case SET_SHOW_BOILERPLATE:
      return {...state, showBoilerplate: action.show};

    case SET_SESSION_DETAILS: {
      const automationName = action.driver.capabilities.automationName;
      return {
        ...state,
        serverDetails: action.serverDetails,
        driver: action.driver,
        sessionCaps: action.sessionCaps,
        automationName: automationName && automationName.toLowerCase(),
        appMode: action.appMode,
        isUsingMjpegMode: action.isUsingMjpegMode,
      };
    }

    case STORE_SESSION_SETTINGS:
      return {
        ...state,
        sessionSettings: {...state.sessionSettings, ...action.sessionSettings},
      };

    case SHOW_LOCATOR_TEST_MODAL:
      return {
        ...state,
        isLocatorTestModalVisible: true,
      };

    case HIDE_LOCATOR_TEST_MODAL:
      return {
        ...state,
        isLocatorTestModalVisible: false,
      };

    case SHOW_SIRI_COMMAND_MODAL:
      return {
        ...state,
        isSiriCommandModalVisible: true,
      };

    case HIDE_SIRI_COMMAND_MODAL:
      return {
        ...state,
        isSiriCommandModalVisible: false,
      };

    case SET_SIRI_COMMAND_VALUE:
      return {
        ...state,
        siriCommandValue: action.siriCommandValue,
      };

    case SET_LOCATOR_TEST_STRATEGY:
      return {
        ...state,
        locatorTestStrategy: action.locatorTestStrategy,
      };

    case SET_LOCATOR_TEST_VALUE:
      return {
        ...state,
        locatorTestValue: action.locatorTestValue,
      };

    case SEARCHING_FOR_ELEMENTS:
      return {
        ...state,
        locatedElements: null,
        locatedElementsExecutionTime: null,
        locatorTestElement: null,
        isSearchingForElements: true,
      };

    case SEARCHING_FOR_ELEMENTS_COMPLETED:
      return {
        ...state,
        locatedElements: action.elements,
        locatedElementsExecutionTime: action.executionTime,
        isSearchingForElements: false,
      };

    case GET_FIND_ELEMENTS_TIMES:
      return {
        ...state,
        isFindingElementsTimes: true,
      };

    case GET_FIND_ELEMENTS_TIMES_COMPLETED:
      return {
        ...state,
        findElementsExecutionTimes: action.findElementsExecutionTimes,
        isFindingElementsTimes: false,
      };

    case SET_LOCATOR_TEST_ELEMENT:
      return {
        ...state,
        locatorTestElement: action.elementId,
      };

    case FINDING_ELEMENT_IN_SOURCE:
      return {
        ...state,
        isFindingLocatedElementInSource: true,
      };

    case FINDING_ELEMENT_IN_SOURCE_COMPLETED:
      return {
        ...state,
        isFindingLocatedElementInSource: false,
      };

    case CLEAR_SEARCH_RESULTS:
      return {
        ...state,
        locatedElements: null,
        isFindingLocatedElementInSource: false,
      };

    case SET_MJPEG_STATE:
      return {
        ...state,
        isUsingMjpegMode: action.targetMjpegState,
      };

    case SET_SCREENSHOT_INTERACTION_MODE:
      return {
        ...state,
        screenshotInteractionMode: action.screenshotInteractionMode,
      };

    case SET_COORD_START:
      return {
        ...state,
        coordStart: {
          x: action.coordStartX,
          y: action.coordStartY,
        },
      };

    case SET_COORD_END:
      return {
        ...state,
        coordEnd: {
          x: action.coordEndX,
          y: action.coordEndY,
        },
      };

    case CLEAR_COORD_ACTION:
      return {
        ...state,
        coordStart: null,
        coordEnd: null,
      };

    case SET_SEARCHED_FOR_ELEMENT_BOUNDS:
      return {
        ...state,
        searchedForElementBounds: {
          location: action.location,
          size: action.size,
        },
      };

    case CLEAR_SEARCHED_FOR_ELEMENT_BOUNDS:
      return {
        ...state,
        searchedForElementBounds: null,
      };

    case PROMPT_KEEP_ALIVE:
      return {
        ...state,
        showKeepAlivePrompt: true,
      };

    case HIDE_PROMPT_KEEP_ALIVE:
      return {
        ...state,
        showKeepAlivePrompt: false,
      };

    case SELECT_INSPECTOR_TAB:
      return {
        ...state,
        selectedInspectorTab: action.interaction,
      };

    case SET_APP_MODE:
      return {
        ...state,
        appMode: action.mode,
      };

    case SET_SHOW_CENTROIDS:
      return {
        ...state,
        showCentroids: action.show,
      };

    case SET_CONTEXT:
      return {
        ...state,
        currentContext: action.context,
      };

    case SET_KEEP_ALIVE_INTERVAL:
      return {
        ...state,
        keepAliveInterval: action.keepAliveInterval,
      };

    case SET_USER_WAIT_TIMEOUT:
      return {
        ...state,
        userWaitTimeout: action.userWaitTimeout,
      };

    case SET_LAST_ACTIVE_MOMENT:
      return {
        ...state,
        lastActiveMoment: action.lastActiveMoment,
      };

    case SET_SESSION_TIME:
      return {
        ...state,
        sessionStartTime: action.sessionStartTime,
      };

    case SET_APP_ID:
      return {
        ...state,
        appId: action.appId,
      };

    case SET_SERVER_STATUS:
      return {
        ...state,
        status: action.status,
      };

    case SET_FLAT_SESSION_CAPS:
      return {
        ...state,
        flatSessionCaps: action.flatSessionCaps,
      };

    case SET_AWAITING_MJPEG_STREAM:
      return {...state, isAwaitingMjpegStream: action.isAwaiting};

    case GESTURE_UPLOAD_REQUESTED:
      return {
        ...state,
        isUploadingGestureFiles: true,
      };

    case GESTURE_UPLOAD_DONE:
      return {
        ...state,
        isUploadingGestureFiles: false,
      };

    case SHOW_GESTURE_EDITOR:
      return {
        ...state,
        isGestureEditorVisible: true,
      };

    case HIDE_GESTURE_EDITOR:
      return {
        ...state,
        isGestureEditorVisible: false,
      };

    case GET_SAVED_GESTURES_REQUESTED:
      return {
        ...state,
        getSavedGesturesRequested: true,
      };

    case GET_SAVED_GESTURES_DONE:
      nextState = {
        ...state,
        savedGestures: action.savedGestures || [],
      };
      return _.omit(nextState, 'getSavedGesturesRequested');

    case DELETE_SAVED_GESTURES_REQUESTED:
      return {
        ...state,
        deleteGesture: action.deleteGesture,
      };

    case DELETE_SAVED_GESTURES_DONE:
      return _.omit(state, 'deleteGesture');

    case SET_LOADED_GESTURE:
      return {
        ...state,
        loadedGesture: action.loadedGesture,
      };

    case REMOVE_LOADED_GESTURE:
      return _.omit(state, 'loadedGesture');

    case SHOW_GESTURE_ACTION:
      return {
        ...state,
        showGesture: action.showGesture,
      };

    case HIDE_GESTURE_ACTION:
      return _.omit(state, 'showGesture');

    case SELECT_TICK_ELEMENT:
      return {
        ...state,
        selectedTick: action.selectedTick,
      };

    case UNSELECT_TICK_ELEMENT:
      return _.omit(state, 'selectedTick');

    case SET_GESTURE_TAP_COORDS_MODE:
      return {
        ...state,
        tickCoordinates: {
          x: action.x,
          y: action.y,
        },
      };

    case CLEAR_TAP_COORDINATES:
      return _.omit(state, 'tickCoordinates');

    case TOGGLE_SHOW_ATTRIBUTES:
      return {...state, showSourceAttrs: !state.showSourceAttrs};

    case SET_REFRESHING_STATE:
      return {...state, isSourceRefreshOn: action.refreshStates.source};

    case SET_AUTO_SESSION_RESTART:
      return {
        ...state,
        autoSessionRestart: action.autoSessionRestart,
      };

    default:
      return {...state};
  }
}
