import {configureStore} from '@reduxjs/toolkit';
import {describe, expect, it} from 'vitest';

import {SCREENSHOT_INTERACTION_MODE} from '../../app/common/renderer/constants/screenshot.js';
import {
  APP_MODE,
  CLIENT_FRAMEWORKS,
  INSPECTOR_TABS,
  NATIVE_APP,
} from '../../app/common/renderer/constants/session-inspector.js';
import createRootReducer from '../../app/common/renderer/reducers/index.js';
import inspector, {
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
} from '../../app/common/renderer/reducers/SessionInspector.js';

describe('reducers/SessionInspector', function () {
  it('should initialize with default inspector state', function () {
    const state = inspector(undefined, {type: '@@INIT'});
    expect(state.expandedPaths).toEqual(['0']);
    expect(state.isSourceRefreshOn).toBe(true);
    expect(state.clientFramework).toBe(CLIENT_FRAMEWORKS.JAVA_JUNIT4);
    expect(state.selectedInspectorTab).toBe(INSPECTOR_TABS.SOURCE);
    expect(state.appMode).toBe(APP_MODE.NATIVE);
    expect(state.screenshotInteractionMode).toBe(SCREENSHOT_INTERACTION_MODE.SELECT);
    expect(state.isAwaitingMjpegStream).toBe(true);
  });

  it('should handle source updates, element selection, and full session reset', function () {
    let state = inspector(
      undefined,
      setSourceAndScreenshot({
        contexts: [NATIVE_APP],
        sourceXML: '<App />',
        sourceJSON: {children: []},
        screenshot: 'abc',
        windowSize: {width: 100, height: 200},
      }),
    );
    expect(state.currentContext).toBe(NATIVE_APP);
    expect(state.findElementsExecutionTimes).toEqual([]);

    state = inspector(state, selectElement({path: '0.1'}));
    expect(state.selectedElementPath).toBe('0.1');
    expect(state.selectedElementSearchInProgress).toBe(true);

    state = inspector(state, setOptimalLocators([['id', 'btn']]));
    expect(state.selectedElement.strategyMap).toEqual([['id', 'btn']]);

    state = inspector(state, setSelectedElementId('el-1'));
    expect(state.selectedElementId).toBe('el-1');
    expect(state.selectedElementSearchInProgress).toBe(false);

    state = inspector(state, setInteractionsNotAvailable());
    expect(state.elementInteractionsNotAvailable).toBe(true);

    state = inspector(state, unselectElement());
    expect(state.selectedElement).toBeUndefined();
    expect(state.selectedElementPath).toBeNull();

    state = inspector(state, selectCentroid('0.1'));
    expect(state.selectedCentroid).toBe('0.1');
    state = inspector(state, unselectCentroid());
    expect(state).not.toHaveProperty('selectedCentroid');

    state = inspector(state, quitSessionRequested());
    expect(state.isQuittingSession).toBe(true);
    state = inspector(state, sessionDone());
    expect(state.isSessionDone).toBe(true);
    expect(state.methodCallInProgress).toBe(false);

    state = inspector(state, quitSessionDone());
    expect(state).not.toHaveProperty('sourceXML');
    expect(state).not.toHaveProperty('isQuittingSession');
    expect(state).not.toHaveProperty('selectedElementPath');
  });

  it('should handle recording, var cache, search, gestures, and settings transitions', function () {
    let state = inspector(undefined, methodCallRequested());
    expect(state.methodCallInProgress).toBe(true);
    state = inspector(state, methodCallDone());
    expect(state.methodCallInProgress).toBe(false);

    state = inspector(state, setExpandedPaths(['0', '0.0']));
    expect(state.expandedPaths).toEqual(['0', '0.0']);

    state = inspector(state, startRecording());
    expect(state.isRecording).toBe(true);
    state = inspector(state, recordAction({action: 'click', params: ['el1']}));
    state = inspector(state, addAssignedVarCache('el1'));
    expect(state.recordedActions).toEqual([{action: 'click', params: ['el1']}]);
    expect(state.assignedVarCache).toEqual({el1: true});
    state = inspector(state, pauseRecording());
    expect(state.isRecording).toBe(false);
    state = inspector(state, clearRecording());
    state = inspector(state, clearAssignedVarCache());
    expect(state.recordedActions).toEqual([]);
    expect(state.assignedVarCache).toEqual({});

    state = inspector(state, setClientFramework(CLIENT_FRAMEWORKS.JS_WDIO));
    state = inspector(state, setShowBoilerplate(true));
    state = inspector(state, storeSessionSettings({ignoreUnimportantViews: true}));
    state = inspector(state, storeSessionSettings({allowInvisibleElements: false}));
    expect(state.sessionSettings).toEqual({ignoreUnimportantViews: true, allowInvisibleElements: false});

    state = inspector(state, showLocatorSearchModal());
    state = inspector(state, setLocatorSearchStrategy('xpath'));
    state = inspector(state, setLocatorSearchValue('//Button'));
    state = inspector(state, searchingForElements());
    expect(state.isSearchingForElements).toBe(true);
    state = inspector(state, searchingForElementsCompleted());
    expect(state.isSearchingForElements).toBe(false);
    expect(state.locatedElements).toBeUndefined();

    state = inspector(state, searchingForElementsCompleted({elements: ['e1'], executionTime: 12}));
    expect(state.locatedElements).toEqual(['e1']);
    state = inspector(state, selectLocatedElement('e1'));
    state = inspector(state, getFindElementsTimes());
    state = inspector(state, getFindElementsTimesCompleted());
    expect(state.isFindingElementsTimes).toBe(false);
    state = inspector(state, findingElementInSource());
    state = inspector(state, findingElementInSourceCompleted());
    state = inspector(state, setSearchedForElementBounds({location: {x: 1, y: 2}, size: {width: 3, height: 4}}));
    state = inspector(state, clearSearchResults());
    state = inspector(state, clearSearchedForElementBounds());
    state = inspector(state, hideLocatorSearchModal());
    expect(state.searchedForElementBounds).toBeNull();
    expect(state.isLocatorSearchModalVisible).toBe(false);

    state = inspector(state, setMjpegState(true));
    state = inspector(state, setScreenshotInteractionMode(SCREENSHOT_INTERACTION_MODE.GESTURE));
    state = inspector(state, setCoordStart({x: 10, y: 20}));
    state = inspector(state, setCoordEnd({x: 30, y: 40}));
    expect(state.coordStart).toEqual({x: 10, y: 20});
    expect(state.coordEnd).toEqual({x: 30, y: 40});
    state = inspector(state, clearCoordAction());
    expect(state.coordStart).toBeNull();
    expect(state.coordEnd).toBeNull();

    state = inspector(state, promptKeepAlive());
    state = inspector(state, hidePromptKeepAlive());
    state = inspector(state, selectInspectorTab(INSPECTOR_TABS.COMMANDS));
    state = inspector(state, setAppMode(APP_MODE.WEB_HYBRID));
    state = inspector(state, setShowCentroids(true));
    state = inspector(state, setContext('WEBVIEW_1'));
    state = inspector(state, setKeepAliveInterval(42));
    state = inspector(state, setUserWaitTimeout(99));
    state = inspector(state, setLastActiveMoment(12345));
    state = inspector(state, setSessionTime(67890));
    state = inspector(state, setAppId('com.example.app'));
    state = inspector(state, setServerStatus({version: '3.0.0'}));
    state = inspector(state, setFlatSessionCaps({platformName: 'Android'}));
    state = inspector(state, setAwaitingMjpegStream(false));
    state = inspector(state, toggleShowAttributes());
    state = inspector(state, setRefreshingState({source: false}));
    state = inspector(state, setAutoSessionRestart(true));
    expect(state.showSourceAttrs).toBe(true);
    expect(state.isSourceRefreshOn).toBe(false);
    expect(state.autoSessionRestart).toBe(true);

    state = inspector(state, gestureUploadRequested());
    state = inspector(state, gestureUploadDone());
    state = inspector(state, showGestureEditor());
    state = inspector(state, hideGestureEditor());
    state = inspector(state, getSavedGesturesRequested());
    state = inspector(state, getSavedGesturesDone([{id: 'g1'}]));
    expect(state).not.toHaveProperty('getSavedGesturesRequested');
    state = inspector(state, deleteSavedGesturesRequested('g1'));
    state = inspector(state, deleteSavedGesturesDone());
    expect(state).not.toHaveProperty('deleteGesture');
    state = inspector(state, setLoadedGesture({id: 'g1'}));
    state = inspector(state, removeLoadedGesture());
    expect(state).not.toHaveProperty('loadedGesture');
    state = inspector(state, showGestureAction({name: 'swipe'}));
    state = inspector(state, hideGestureAction());
    expect(state).not.toHaveProperty('showGesture');
    state = inspector(state, selectTickElement('0.0'));
    state = inspector(state, unselectTickElement());
    expect(state).not.toHaveProperty('selectedTick');
    state = inspector(state, setGestureTapCoordsMode({x: 5, y: 6}));
    expect(state.tickCoordinates).toEqual({x: 5, y: 6});
    state = inspector(state, clearTapCoordinates());
    expect(state).not.toHaveProperty('tickCoordinates');
  });

  it('should work with Redux Toolkit configureStore and non-plain driver instances', function () {
    class MockDriver {}
    const driver = new MockDriver();
    const store = configureStore({
      reducer: createRootReducer(),
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: false,
        }),
    });

    store.dispatch(
      setSessionDetails({
        serverDetails: {host: '127.0.0.1'},
        driver,
        sessionCaps: {platformName: 'Android'},
        featureCaps: {platformName: 'android'},
        appMode: APP_MODE.NATIVE,
        isUsingMjpegMode: false,
      }),
    );

    expect(store.getState().inspector.driver).toBe(driver);
    expect(store.getState().inspector.serverDetails).toEqual({host: '127.0.0.1'});
    expect(store.getState().builder).toBeDefined();
  });
});
