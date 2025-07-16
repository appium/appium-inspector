import _ from 'lodash';

import {
  ADD_ASSIGNED_VAR_CACHE,
  CANCEL_PENDING_COMMAND,
  CLEAR_ASSIGNED_VAR_CACHE,
  CLEAR_COORD_ACTION,
  CLEAR_RECORDING,
  CLEAR_SEARCH_RESULTS,
  CLEAR_SEARCHED_FOR_ELEMENT_BOUNDS,
  CLEAR_TAP_COORDINATES,
  DELETE_SAVED_GESTURES_DONE,
  DELETE_SAVED_GESTURES_REQUESTED,
  ENTERING_COMMAND_ARGS,
  FINDING_ELEMENT_IN_SOURCE,
  FINDING_ELEMENT_IN_SOURCE_COMPLETED,
  GET_FIND_ELEMENTS_TIMES,
  GET_FIND_ELEMENTS_TIMES_COMPLETED,
  GET_SAVED_GESTURES_DONE,
  GET_SAVED_GESTURES_REQUESTED,
  HIDE_GESTURE_ACTION,
  HIDE_GESTURE_EDITOR,
  HIDE_LOCATOR_TEST_MODAL,
  HIDE_PROMPT_KEEP_ALIVE,
  HIDE_SIRI_COMMAND_MODAL,
  METHOD_CALL_DONE,
  METHOD_CALL_REQUESTED,
  PAUSE_RECORDING,
  PROMPT_KEEP_ALIVE,
  QUIT_SESSION_DONE,
  QUIT_SESSION_REQUESTED,
  RECORD_ACTION,
  REMOVE_LOADED_GESTURE,
  SEARCHING_FOR_ELEMENTS,
  SEARCHING_FOR_ELEMENTS_COMPLETED,
  SELECT_CENTROID,
  SELECT_ELEMENT,
  SELECT_HOVERED_CENTROID,
  SELECT_HOVERED_ELEMENT,
  SELECT_INSPECTOR_TAB,
  SELECT_TICK_ELEMENT,
  SESSION_DONE,
  SET_APP_ID,
  SET_APP_MODE,
  SET_AWAITING_MJPEG_STREAM,
  SET_CLIENT_FRAMEWORK,
  SET_COMMAND_ARG,
  SET_CONTEXT,
  SET_COORD_END,
  SET_COORD_START,
  SET_EXPANDED_PATHS,
  SET_FLAT_SESSION_CAPS,
  SET_GESTURE_TAP_COORDS_MODE,
  SET_GESTURE_UPLOAD_ERROR,
  SET_INTERACTIONS_NOT_AVAILABLE,
  SET_KEEP_ALIVE_INTERVAL,
  SET_LAST_ACTIVE_MOMENT,
  SET_LOADED_GESTURE,
  SET_LOCATOR_TEST_ELEMENT,
  SET_LOCATOR_TEST_STRATEGY,
  SET_LOCATOR_TEST_VALUE,
  SET_OPTIMAL_LOCATORS,
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
  SET_USER_WAIT_TIMEOUT,
  SET_VISIBLE_COMMAND_RESULT,
  SHOW_GESTURE_ACTION,
  SHOW_GESTURE_EDITOR,
  SHOW_LOCATOR_TEST_MODAL,
  SHOW_SIRI_COMMAND_MODAL,
  START_RECORDING,
  STORE_SESSION_SETTINGS,
  TOGGLE_REFRESHING_STATE,
  TOGGLE_SHOW_ATTRIBUTES,
  UNSELECT_CENTROID,
  UNSELECT_ELEMENT,
  UNSELECT_HOVERED_CENTROID,
  UNSELECT_HOVERED_ELEMENT,
  UNSELECT_TICK_ELEMENT,
} from '../actions/Inspector';
import {SCREENSHOT_INTERACTION_MODE} from '../constants/screenshot';
import {
  APP_MODE,
  CLIENT_FRAMEWORKS,
  INSPECTOR_TABS,
  NATIVE_APP,
} from '../constants/session-inspector';

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
  isSourceRefreshOn: true,
  showBoilerplate: false,
  recordedActions: [],
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
  pendingCommand: null,
  findElementsExecutionTimes: [],
  isFindingElementsTimes: false,
  isFindingLocatedElementInSource: false,
  visibleCommandResult: null,
  visibleCommandMethod: null,
  isAwaitingMjpegStream: true,
  showSourceAttrs: false,
  gestureUploadErrors: null,
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

    case SET_INTERACTIONS_NOT_AVAILABLE:
      return {
        ...state,
        elementInteractionsNotAvailable: true,
        selectedElementSearchInProgress: false,
      };

    case SELECT_HOVERED_ELEMENT:
      return {
        ...state,
        hoveredElement: action.hoveredElement,
      };

    case UNSELECT_HOVERED_ELEMENT:
      return _.omit(state, 'hoveredElement');

    case SELECT_HOVERED_CENTROID:
      return {
        ...state,
        hoveredCentroid: action.path,
      };

    case UNSELECT_HOVERED_CENTROID:
      return _.omit(state, 'hoveredCentroid');

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

    case ENTERING_COMMAND_ARGS:
      return {
        ...state,
        pendingCommand: {
          commandName: action.commandName,
          command: action.command,
          args: [],
        },
      };

    case SET_COMMAND_ARG:
      return {
        ...state,
        pendingCommand: {
          ...state.pendingCommand,
          args: Object.assign([], state.pendingCommand.args, {[action.index]: action.value}), // Replace 'value' at 'index'
        },
      };

    case CANCEL_PENDING_COMMAND:
      return {
        ...state,
        pendingCommand: null,
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

    case SET_VISIBLE_COMMAND_RESULT:
      return {
        ...state,
        visibleCommandResult: action.result,
        visibleCommandMethod: action.methodName,
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

    case TOGGLE_REFRESHING_STATE:
      return {...state, isSourceRefreshOn: !state.isSourceRefreshOn};

    case SET_GESTURE_UPLOAD_ERROR:
      return {...state, gestureUploadErrors: action.errors};

    default:
      return {...state};
  }
}
