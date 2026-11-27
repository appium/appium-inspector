import {createSlice} from '@reduxjs/toolkit';

import {SCREENSHOT_INTERACTION_MODE} from '../constants/screenshot.js';
import {APP_MODE, CLIENT_FRAMEWORKS, INSPECTOR_TABS, NATIVE_APP} from '../constants/session-inspector.js';

const INITIAL_STATE = {
  savedGestures: [],
  driver: null,
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
  featureCaps: {},
  sessionSettings: {},
  isGestureEditorVisible: false,
  isLocatorSearchModalVisible: false,
  showCentroids: false,
  locatorSearchStrategy: 'id',
  locatorSearchValue: '',
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

const inspectorSlice = createSlice({
  name: 'inspector',
  initialState: INITIAL_STATE,
  reducers: {
    setSourceAndScreenshot: (state, action) => {
      const {
        contexts,
        contextsError,
        currentContext,
        currentContextError,
        sourceJSON,
        sourceXML,
        sourceError,
        screenshot,
        screenshotError,
        windowSize,
        windowSizeError,
      } = action.payload;
      state.contexts = contexts;
      state.contextsError = contextsError;
      state.currentContext = currentContext || NATIVE_APP;
      state.currentContextError = currentContextError;
      state.sourceJSON = sourceJSON;
      state.sourceXML = sourceXML;
      state.sourceError = sourceError;
      state.screenshot = screenshot;
      state.screenshotError = screenshotError;
      state.windowSize = windowSize;
      state.windowSizeError = windowSizeError;
      state.findElementsExecutionTimes = [];
    },

    quitSessionRequested: (state) => {
      state.methodCallInProgress = true;
      state.isQuittingSession = true;
    },

    quitSessionDone: () => INITIAL_STATE,

    sessionDone: (state) => {
      state.isSessionDone = true;
      state.methodCallInProgress = false;
    },

    selectElement: (state, action) => {
      state.selectedElement = action.payload;
      state.selectedElementPath = action.payload.path;
      state.selectedElementId = null;
      state.selectedElementSearchInProgress = true;
      state.elementInteractionsNotAvailable = false;
      state.findElementsExecutionTimes = [];
    },

    setOptimalLocators: (state, action) => {
      state.selectedElement = {
        ...state.selectedElement,
        strategyMap: action.payload,
      };
    },

    unselectElement: (state) => {
      state.selectedElement = undefined;
      state.selectedElementPath = null;
      state.selectedElementId = null;
      state.selectedElementSearchInProgress = false;
    },

    selectCentroid: (state, action) => {
      state.selectedCentroid = action.payload;
    },

    unselectCentroid: (state) => {
      delete state.selectedCentroid;
    },

    setSelectedElementId: (state, action) => {
      state.selectedElementId = action.payload;
      state.selectedElementSearchInProgress = false;
      state.findElementsExecutionTimes = [];
    },

    setInteractionsNotAvailable: (state) => {
      state.elementInteractionsNotAvailable = true;
      state.selectedElementSearchInProgress = false;
    },

    methodCallRequested: (state) => {
      state.methodCallInProgress = true;
    },

    methodCallDone: (state) => {
      state.methodCallInProgress = false;
    },

    setExpandedPaths: (state, action) => {
      state.expandedPaths = action.payload;
      state.findElementsExecutionTimes = [];
    },

    startRecording: (state) => {
      state.isRecording = true;
    },

    pauseRecording: (state) => {
      state.isRecording = false;
    },

    clearRecording: (state) => {
      state.recordedActions = [];
    },

    setClientFramework: (state, action) => {
      state.clientFramework = action.payload;
    },

    recordAction: (state, action) => {
      const {action: actionName, params} = action.payload;
      state.recordedActions.push({action: actionName, params});
    },

    addAssignedVarCache: (state, action) => {
      state.assignedVarCache[action.payload] = true;
    },

    clearAssignedVarCache: (state) => {
      state.assignedVarCache = {};
    },

    setShowBoilerplate: (state, action) => {
      state.showBoilerplate = action.payload;
    },

    setSessionDetails: (state, action) => {
      const {serverDetails, driver, sessionCaps, featureCaps, appMode, isUsingMjpegMode} = action.payload;
      state.serverDetails = serverDetails;
      state.driver = driver;
      state.sessionCaps = sessionCaps;
      state.featureCaps = featureCaps;
      state.appMode = appMode;
      state.isUsingMjpegMode = isUsingMjpegMode;
    },

    storeSessionSettings: (state, action) => {
      state.sessionSettings = {...state.sessionSettings, ...action.payload};
    },

    showLocatorSearchModal: (state) => {
      state.isLocatorSearchModalVisible = true;
    },

    hideLocatorSearchModal: (state) => {
      state.isLocatorSearchModalVisible = false;
    },

    setLocatorSearchStrategy: (state, action) => {
      state.locatorSearchStrategy = action.payload;
    },

    setLocatorSearchValue: (state, action) => {
      state.locatorSearchValue = action.payload;
    },

    searchingForElements: (state) => {
      state.locatedElements = null;
      state.locatedElementsExecutionTime = null;
      state.locatedElement = null;
      state.isSearchingForElements = true;
    },

    searchingForElementsCompleted: (state, action) => {
      const {elements, executionTime} = action.payload ?? {};
      state.locatedElements = elements;
      state.locatedElementsExecutionTime = executionTime;
      state.isSearchingForElements = false;
    },

    getFindElementsTimes: (state) => {
      state.isFindingElementsTimes = true;
    },

    getFindElementsTimesCompleted: (state, action) => {
      const {findElementsExecutionTimes} = action.payload ?? {};
      state.findElementsExecutionTimes = findElementsExecutionTimes;
      state.isFindingElementsTimes = false;
    },

    selectLocatedElement: (state, action) => {
      state.locatedElement = action.payload;
    },

    findingElementInSource: (state) => {
      state.isFindingLocatedElementInSource = true;
    },

    findingElementInSourceCompleted: (state) => {
      state.isFindingLocatedElementInSource = false;
    },

    clearSearchResults: (state) => {
      state.locatedElements = null;
      state.isFindingLocatedElementInSource = false;
    },

    setMjpegState: (state, action) => {
      state.isUsingMjpegMode = action.payload;
    },

    setScreenshotInteractionMode: (state, action) => {
      state.screenshotInteractionMode = action.payload;
    },

    setCoordStart: (state, action) => {
      const {x, y} = action.payload;
      state.coordStart = {x, y};
    },

    setCoordEnd: (state, action) => {
      const {x, y} = action.payload;
      state.coordEnd = {x, y};
    },

    clearCoordAction: (state) => {
      state.coordStart = null;
      state.coordEnd = null;
    },

    setSearchedForElementBounds: (state, action) => {
      const {location, size} = action.payload;
      state.searchedForElementBounds = {location, size};
    },

    clearSearchedForElementBounds: (state) => {
      state.searchedForElementBounds = null;
    },

    promptKeepAlive: (state) => {
      state.showKeepAlivePrompt = true;
    },

    hidePromptKeepAlive: (state) => {
      state.showKeepAlivePrompt = false;
    },

    selectInspectorTab: (state, action) => {
      state.selectedInspectorTab = action.payload;
    },

    setAppMode: (state, action) => {
      state.appMode = action.payload;
    },

    setShowCentroids: (state, action) => {
      state.showCentroids = action.payload;
    },

    setContext: (state, action) => {
      state.currentContext = action.payload;
    },

    setKeepAliveInterval: (state, action) => {
      state.keepAliveInterval = action.payload;
    },

    setUserWaitTimeout: (state, action) => {
      state.userWaitTimeout = action.payload;
    },

    setLastActiveMoment: (state, action) => {
      state.lastActiveMoment = action.payload;
    },

    setSessionTime: (state, action) => {
      state.sessionStartTime = action.payload;
    },

    setAppId: (state, action) => {
      state.appId = action.payload;
    },

    setServerStatus: (state, action) => {
      state.status = action.payload;
    },

    setFlatSessionCaps: (state, action) => {
      state.flatSessionCaps = action.payload;
    },

    setAwaitingMjpegStream: (state, action) => {
      state.isAwaitingMjpegStream = action.payload;
    },

    gestureUploadRequested: (state) => {
      state.isUploadingGestureFiles = true;
    },

    gestureUploadDone: (state) => {
      state.isUploadingGestureFiles = false;
    },

    showGestureEditor: (state) => {
      state.isGestureEditorVisible = true;
    },

    hideGestureEditor: (state) => {
      state.isGestureEditorVisible = false;
    },

    getSavedGesturesRequested: (state) => {
      state.getSavedGesturesRequested = true;
    },

    getSavedGesturesDone: (state, action) => {
      state.savedGestures = action.payload || [];
      delete state.getSavedGesturesRequested;
    },

    deleteSavedGesturesRequested: (state, action) => {
      state.deleteGesture = action.payload;
    },

    deleteSavedGesturesDone: (state) => {
      delete state.deleteGesture;
    },

    setLoadedGesture: (state, action) => {
      state.loadedGesture = action.payload;
    },

    removeLoadedGesture: (state) => {
      delete state.loadedGesture;
    },

    showGestureAction: (state, action) => {
      state.showGesture = action.payload;
    },

    hideGestureAction: (state) => {
      delete state.showGesture;
    },

    selectTickElement: (state, action) => {
      state.selectedTick = action.payload;
    },

    unselectTickElement: (state) => {
      delete state.selectedTick;
    },

    setGestureTapCoordsMode: (state, action) => {
      const {x, y} = action.payload ?? {};
      state.tickCoordinates = {x, y};
    },

    clearTapCoordinates: (state) => {
      delete state.tickCoordinates;
    },

    toggleShowAttributes: (state) => {
      state.showSourceAttrs = !state.showSourceAttrs;
    },

    setRefreshingState: (state, action) => {
      state.isSourceRefreshOn = action.payload.source;
    },

    setAutoSessionRestart: (state, action) => {
      state.autoSessionRestart = action.payload;
    },
  },
});

export const {
  addAssignedVarCache,
  clearAssignedVarCache,
  clearCoordAction,
  clearRecording,
  clearSearchResults,
  clearSearchedForElementBounds,
  clearTapCoordinates,
  deleteSavedGesturesDone,
  deleteSavedGesturesRequested,
  findingElementInSource,
  findingElementInSourceCompleted,
  gestureUploadDone,
  gestureUploadRequested,
  getFindElementsTimes,
  getFindElementsTimesCompleted,
  getSavedGesturesDone,
  getSavedGesturesRequested,
  hideGestureAction,
  hideGestureEditor,
  hideLocatorSearchModal,
  hidePromptKeepAlive,
  methodCallDone,
  methodCallRequested,
  pauseRecording,
  promptKeepAlive,
  quitSessionDone,
  quitSessionRequested,
  recordAction,
  removeLoadedGesture,
  searchingForElements,
  searchingForElementsCompleted,
  selectCentroid,
  selectElement,
  selectInspectorTab,
  selectLocatedElement,
  selectTickElement,
  sessionDone,
  setAppId,
  setAppMode,
  setAutoSessionRestart,
  setAwaitingMjpegStream,
  setClientFramework,
  setContext,
  setCoordEnd,
  setCoordStart,
  setExpandedPaths,
  setFlatSessionCaps,
  setGestureTapCoordsMode,
  setInteractionsNotAvailable,
  setKeepAliveInterval,
  setLastActiveMoment,
  setLoadedGesture,
  setLocatorSearchStrategy,
  setLocatorSearchValue,
  setMjpegState,
  setOptimalLocators,
  setRefreshingState,
  setScreenshotInteractionMode,
  setSearchedForElementBounds,
  setSelectedElementId,
  setServerStatus,
  setSessionDetails,
  setSessionTime,
  setShowBoilerplate,
  setShowCentroids,
  setSourceAndScreenshot,
  setUserWaitTimeout,
  showGestureAction,
  showGestureEditor,
  showLocatorSearchModal,
  startRecording,
  storeSessionSettings,
  toggleShowAttributes,
  unselectCentroid,
  unselectElement,
  unselectTickElement,
} = inspectorSlice.actions;

export default inspectorSlice.reducer;
