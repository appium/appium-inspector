import {configureStore} from '@reduxjs/toolkit';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

const {
  readFiles,
  download,
  showError,
  runCommand,
  clearInstance,
  decodeImage,
  startSession,
  createObjectURL,
  revokeObjectURL,
  log,
} = vi.hoisted(() => ({
  readFiles: vi.fn(),
  download: vi.fn(),
  showError: vi.fn(),
  runCommand: vi.fn(),
  clearInstance: vi.fn(),
  decodeImage: vi.fn(),
  startSession: vi.fn(),
  createObjectURL: vi.fn(),
  revokeObjectURL: vi.fn(),
  log: {info: vi.fn(), warn: vi.fn(), error: vi.fn()},
}));

vi.mock('../../app/common/renderer/i18next.js', () => ({default: {t: (key) => key}}));
vi.mock('../../app/common/renderer/polyfills.js', () => ({getSetting: vi.fn(), setSetting: vi.fn()}));
vi.mock('../../app/common/renderer/actions/SessionBuilder.js', () => ({showError, newSession: startSession}));
vi.mock('../../app/common/renderer/utils/file-handling.js', () => ({
  readTextFromUploadedFiles: readFiles,
  downloadFile: download,
}));
vi.mock('../../app/common/renderer/lib/appium/inspector-driver.js', () => ({
  default: {clearInstance, instance: () => ({run: runCommand})},
}));
vi.mock('../../app/common/renderer/utils/logger.js', () => ({log}));
vi.mock('../../app/common/renderer/utils/notification.js', () => ({notification: {info: vi.fn()}}));

import {
  applyClientMethod,
  callClientMethod,
  executeDriverCommand,
  exportSnapshot,
  findLocatedElementInSource,
  getActiveAppId,
  getFindElementsTimes,
  getFlatSessionCaps,
  getSavedClientFramework,
  getServerStatus,
  getSupportedSessionMethods,
  killKeepAliveLoop,
  LOAD_SNAPSHOT,
  openSnapshot,
  quitSession,
  runKeepAliveLoop,
  searchForElement,
  selectElement,
  selectLocatedElement,
  SET_AUTO_SESSION_RESTART,
  SET_SESSION_DETAILS,
  SET_SOURCE_AND_SCREENSHOT,
  storeSessionSettings,
  tapElement,
} from '../../app/common/renderer/actions/SessionInspector.js';
import {DRIVERS} from '../../app/common/renderer/constants/common.js';
import {getSetting} from '../../app/common/renderer/polyfills.js';
import reducer from '../../app/common/renderer/reducers/SessionInspector.js';
import {MAX_SNAPSHOT_FILE_SIZE, parseSnapshot} from '../../app/common/renderer/utils/snapshot.js';
import {xmlToJSON} from '../../app/common/renderer/utils/source-parsing.js';

const screenshot = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=';
const sourceXML =
  '<hierarchy><android.widget.Button text="Continue" resource-id="app:id/continue" bounds="[0,0][100,50]" /></hierarchy>';
const snapshot = {
  format: 'appium-inspector-snapshot',
  version: 1,
  capturedAt: '2026-10-24T12:00:00.000Z',
  sourceXML,
  screenshot,
  windowSize: {width: 100, height: 200},
  currentContext: 'NATIVE_APP',
  appMode: 'native',
  featureCaps: {automationName: 'uiautomator2', platformName: 'android', platformVersion: 16},
};

const sessionInfoGetters = [
  ['server status', getServerStatus, {build: {version: '4.0.0'}}, 'status', {version: '4.0.0'}],
  [
    'capabilities',
    getFlatSessionCaps,
    {capabilities: {platformName: 'Android'}},
    'flatSessionCaps',
    {platformName: 'Android'},
  ],
  ['iOS app ID', () => getActiveAppId(DRIVERS.XCUITEST), {bundleId: 'com.example.ios'}, 'appId', 'com.example.ios'],
  [
    'UiAutomator2 app ID',
    () => getActiveAppId(DRIVERS.UIAUTOMATOR2),
    'com.example.android',
    'appId',
    'com.example.android',
  ],
  ['Espresso app ID', () => getActiveAppId(DRIVERS.ESPRESSO), 'com.example.espresso', 'appId', 'com.example.espresso'],
];

const sessionTransitions = [
  [
    'a snapshot',
    async (store) => {
      await store.dispatch(quitSession({detachOnly: true}));
      await store.dispatch(openSnapshot([{size: 1000}]));
    },
  ],
  [
    'a replacement live session',
    async (store) => {
      await store.dispatch(quitSession({detachOnly: true}));
      store.dispatch({type: SET_SESSION_DETAILS, driver: {sessionId: 'replacement'}, featureCaps: {}});
    },
  ],
];

function createStore(inspector, builder) {
  return configureStore({
    reducer: {
      inspector: reducer,
      ...(builder && {
        builder: (state = builder, action) => (action.type === 'TEST_SET_BUILDER' ? action.builder : state),
      }),
    },
    preloadedState: inspector ? {inspector} : undefined,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({serializableCheck: false}),
  });
}

describe('Offline snapshot actions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('window', {dispatchEvent: vi.fn()});
    createObjectURL.mockReturnValue('blob:snapshot');
    vi.stubGlobal('URL', {createObjectURL, revokeObjectURL});
    decodeImage.mockResolvedValue(undefined);
    vi.stubGlobal(
      'Image',
      class {
        decode() {
          return decodeImage(this.src);
        }
      },
    );
    readFiles.mockResolvedValue([{content: JSON.stringify(snapshot)}]);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('opens a snapshot into clean offline state and cancels stale background work', async () => {
    const stalePing = vi.fn();
    const staleExpiry = vi.fn();
    const initial = reducer(undefined, {});
    const store = createStore({
      ...initial,
      serverDetails: {hostname: 'old-server', password: 'secret'},
      sessionCaps: {accessKey: 'secret'},
      isRecording: true,
      selectedElementId: 'stale-element',
      autoSessionRestart: true,
      isUsingMjpegMode: true,
      keepAliveInterval: setInterval(stalePing, 20_000),
      userWaitTimeout: setTimeout(staleExpiry, 1000),
    });

    expect(await store.dispatch(openSnapshot([{size: 1000}]))).toBe(true);
    const state = store.getState().inspector;
    expect(state).toMatchObject({
      isSnapshot: true,
      snapshotCapturedAt: snapshot.capturedAt,
      sourceXML,
      screenshot,
      windowSize: snapshot.windowSize,
      currentContext: 'NATIVE_APP',
      featureCaps: snapshot.featureCaps,
      driver: null,
      keepAliveInterval: null,
      userWaitTimeout: null,
      isRecording: false,
      autoSessionRestart: false,
      serverDetails: {},
      sessionCaps: {},
    });
    expect(state.selectedElementId).toBeUndefined();
    expect(state.isUsingMjpegMode).toBeUndefined();
    expect(state.sourceJSON.children[0].tagName).toBe('android.widget.Button');
    store.dispatch(runKeepAliveLoop());
    await vi.advanceTimersByTimeAsync(60_000);
    expect(stalePing).not.toHaveBeenCalled();
    expect(staleExpiry).not.toHaveBeenCalled();
    expect(runCommand).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    expect(decodeImage).toHaveBeenCalledWith(`data:image/png;base64,${screenshot}`);
  });

  it('rejects oversized files before reading and malformed files without changing the view', async () => {
    const store = createStore();
    const initial = store.getState();
    expect(await store.dispatch(openSnapshot([{size: MAX_SNAPSHOT_FILE_SIZE + 1}]))).toBe(false);
    expect(readFiles).not.toHaveBeenCalled();
    expect(store.getState()).toBe(initial);

    readFiles.mockResolvedValue([{content: '{invalid json'}]);
    expect(await store.dispatch(openSnapshot([{size: 100}]))).toBe(false);
    expect(store.getState()).toBe(initial);
    expect(showError).toHaveBeenCalledTimes(2);
  });

  it('rejects a structurally valid image that the browser cannot decode', async () => {
    const store = createStore();
    const initial = store.getState();
    decodeImage.mockRejectedValue(new Error('Corrupt pixel data'));
    expect(await store.dispatch(openSnapshot([{size: 1000}]))).toBe(false);
    expect(store.getState()).toBe(initial);
    expect(showError).toHaveBeenCalledWith(expect.objectContaining({message: 'snapshotImportError'}));
    expect(runCommand).not.toHaveBeenCalled();
  });

  it('does not orphan a live session when asked to import a snapshot', async () => {
    const driver = {deleteSession: vi.fn()};
    const store = createStore({...reducer(undefined, {}), driver});
    expect(await store.dispatch(openSnapshot([{size: 1000}]))).toBe(false);
    expect(readFiles).not.toHaveBeenCalled();
    expect(store.getState().inspector.driver).toBe(driver);
    expect(driver.deleteSession).not.toHaveBeenCalled();
    expect(showError).toHaveBeenCalledWith(
      expect.objectContaining({message: 'snapshotImportError: snapshotSessionOpenError'}),
    );
  });

  it.each(['newSessionRequested', 'newSessionLoading'])('rejects imports while %s is pending', async (flag) => {
    const store = createStore(undefined, {[flag]: true});
    const initial = store.getState();
    expect(await store.dispatch(openSnapshot([{size: 1000}]))).toBe(false);
    expect(readFiles).not.toHaveBeenCalled();
    expect(store.getState()).toBe(initial);
    expect(showError).toHaveBeenCalledWith(
      expect.objectContaining({message: 'snapshotImportError: snapshotSessionOpenError'}),
    );
  });

  it('does not replace a session that starts while an imported image is decoding', async () => {
    const pending = Promise.withResolvers();
    decodeImage.mockReturnValue(pending.promise);
    const store = createStore(undefined, {});
    const imported = store.dispatch(openSnapshot([{size: 1000}]));
    await Promise.resolve();
    expect(decodeImage).toHaveBeenCalledTimes(1);
    store.dispatch({type: 'TEST_SET_BUILDER', builder: {newSessionLoading: true}});
    const startingState = store.getState();

    pending.resolve();
    expect(await imported).toBe(false);
    expect(store.getState()).toBe(startingState);
    expect(showError).toHaveBeenCalledWith(
      expect.objectContaining({message: 'snapshotImportError: snapshotSessionOpenError'}),
    );
  });

  it('generates selectors and selection bounds locally without resolving a remote element', async () => {
    const store = createStore();
    await store.dispatch(openSnapshot([{size: 1000}]));
    await store.dispatch(selectElement('0'));
    const state = store.getState().inspector;
    expect(state.selectedElement.attributes.text).toBe('Continue');
    expect(state.selectedElement.strategyMap).toContainEqual(['id', 'app:id/continue']);
    expect(state.selectedElement.strategyMap.some(([strategy]) => strategy === 'xpath')).toBe(true);
    expect(state.elementInteractionsNotAvailable).toBe(true);
    expect(state.selectedElementSearchInProgress).toBe(false);
    await vi.advanceTimersByTimeAsync(2000);
    expect(runCommand).not.toHaveBeenCalled();
  });

  it.each([
    {
      name: 'iOS native',
      xml: '<App><XCUIElementTypeButton name="Continue" label="Continue" type="XCUIElementTypeButton" x="0" y="0" width="100" height="50" /></App>',
      context: 'NATIVE_APP',
      mode: 'native',
      caps: {automationName: 'xcuitest', platformName: 'ios'},
      locator: ['accessibility id', 'Continue'],
      strategy: '-ios predicate string',
    },
    {
      name: 'webview',
      xml: '<html><body><button id="continue">Continue</button></body></html>',
      context: 'WEBVIEW_app',
      mode: 'web_hybrid',
      caps: {automationName: 'uiautomator2', platformName: 'android'},
      locator: ['css selector', '#continue'],
      strategy: 'xpath',
      path: '0.0',
    },
  ])(
    'generates $name locators from the captured context',
    async ({xml, context, mode, caps, locator, strategy, path}) => {
      const store = createStore();
      readFiles.mockResolvedValue([
        {
          content: JSON.stringify({
            ...snapshot,
            sourceXML: xml,
            currentContext: context,
            appMode: mode,
            featureCaps: caps,
          }),
        },
      ]);
      expect(await store.dispatch(openSnapshot([{size: 1000}]))).toBe(true);
      await store.dispatch(selectElement(path || '0'));
      const strategies = store.getState().inspector.selectedElement.strategyMap;
      expect(strategies).toContainEqual(locator);
      expect(strategies.some(([name]) => name === strategy)).toBe(true);
      expect(runCommand).not.toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(0);
    },
  );

  it('cancels a pending live element lookup when opening a snapshot', async () => {
    const store = createStore();
    store.dispatch({type: SET_SOURCE_AND_SCREENSHOT, sourceXML, sourceJSON: xmlToJSON(sourceXML)});
    await store.dispatch(selectElement('0'));
    expect(vi.getTimerCount()).toBe(1);
    await store.dispatch(openSnapshot([{size: 1000}]));
    await vi.advanceTimersByTimeAsync(2000);
    expect(runCommand).not.toHaveBeenCalled();
  });

  it.each(['getPageSource', 'elementClick', 'updateSettings'])(
    'discards a late %s result after detaching and opening a snapshot',
    async (methodName) => {
      const pending = Promise.withResolvers();
      const store = createStore({
        ...reducer(undefined, {}),
        driver: {sessionId: 'old-session'},
        isRecording: true,
      });
      runCommand.mockReturnValue(pending.promise);
      const refresh = store.dispatch(applyClientMethod({methodName, args: [{ignoreUnimportantViews: true}]}));
      await store.dispatch(quitSession({detachOnly: true}));
      await store.dispatch(openSnapshot([{size: 1000}]));
      const offlineState = store.getState();

      pending.resolve({
        source: '<old-session />',
        screenshot: 'old-screenshot',
        windowSize: {width: 50, height: 50},
        commandRes: {old: true},
      });
      await refresh;
      expect(store.getState()).toBe(offlineState);
      expect(store.getState().inspector.sourceXML).toBe(sourceXML);
      expect(store.getState().inspector.screenshot).toBe(screenshot);
      expect(store.getState().inspector.recordedActions).toEqual([]);
      expect(store.getState().inspector.sessionSettings).toEqual({});
      expect(showError).not.toHaveBeenCalled();
      expect(window.dispatchEvent).not.toHaveBeenCalled();
    },
  );

  it('ignores a rejected command from a detached session after opening a snapshot', async () => {
    const pending = Promise.withResolvers();
    const store = createStore({
      ...reducer(undefined, {}),
      driver: {sessionId: 'old-session'},
      autoSessionRestart: true,
    });
    runCommand.mockReturnValue(pending.promise);
    const refresh = store.dispatch(applyClientMethod({methodName: 'getPageSource'}));
    await store.dispatch(quitSession({detachOnly: true}));
    await store.dispatch(openSnapshot([{size: 1000}]));
    const offlineState = store.getState();

    pending.reject(new Error('Old session disconnected'));
    await refresh;
    expect(store.getState()).toBe(offlineState);
    expect(showError).not.toHaveBeenCalled();
    expect(startSession).not.toHaveBeenCalled();
  });

  it('does not restart a replacement live session when an old command rejects', async () => {
    const pending = Promise.withResolvers();
    const store = createStore({
      ...reducer(undefined, {}),
      driver: {sessionId: 'old-session'},
      autoSessionRestart: true,
    });
    runCommand.mockReturnValue(pending.promise);
    const refresh = store.dispatch(applyClientMethod({methodName: 'getPageSource'}));
    await store.dispatch(quitSession({detachOnly: true}));
    store.dispatch({type: SET_SESSION_DETAILS, driver: {sessionId: 'new-session'}, featureCaps: {}});
    store.dispatch({type: SET_AUTO_SESSION_RESTART, autoSessionRestart: true});
    const liveState = store.getState();

    pending.reject(Object.assign(new Error('Old session disconnected'), {name: 'unknown error'}));
    await refresh;
    expect(store.getState()).toBe(liveState);
    expect(showError).not.toHaveBeenCalled();
    expect(startSession).not.toHaveBeenCalled();
  });

  it('finishes automatic restart including saved framework, settings, keep-alive and timer setup', async () => {
    const caps = [{name: 'platformName', type: 'text', value: 'Android'}];
    const getTimeouts = vi.fn().mockResolvedValue({});
    const driver = {sessionId: 'replacement', getTimeouts};
    const store = createStore(
      {...reducer(undefined, {}), driver: {sessionId: 'old'}, autoSessionRestart: true},
      {caps},
    );
    const restartedSource = '<hierarchy><button /></hierarchy>';
    startSession.mockImplementation(() => async (dispatch) => {
      dispatch({type: SET_SESSION_DETAILS, driver, featureCaps: {}});
      return true;
    });
    vi.mocked(getSetting).mockResolvedValue('jsWdIo');
    runCommand
      .mockRejectedValueOnce(Object.assign(new Error('Session disconnected'), {name: 'unknown error'}))
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({source: restartedSource, screenshot, windowSize: snapshot.windowSize})
      .mockResolvedValueOnce({commandRes: {ignoreUnimportantViews: true}});

    await expect(store.dispatch(applyClientMethod({methodName: 'getPageSource'}))).resolves.toBeUndefined();

    expect(startSession).toHaveBeenCalledExactlyOnceWith(caps);
    expect(runCommand.mock.calls.map(([params]) => params.methodName)).toEqual([
      'getPageSource',
      'deleteSession',
      'getPageSource',
      'getSettings',
    ]);
    expect(store.getState().inspector).toMatchObject({
      driver,
      sourceXML: restartedSource,
      sessionSettings: {ignoreUnimportantViews: true},
      clientFramework: 'jsWdIo',
      sessionStartTime: Date.now(),
      autoSessionRestart: true,
      methodCallInProgress: false,
    });
    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(20_000);
    expect(getTimeouts).toHaveBeenCalledOnce();
  });

  it('discards an in-flight element lookup instead of trying more selectors in the snapshot', async () => {
    const pending = Promise.withResolvers();
    const store = createStore({...reducer(undefined, {}), driver: {sessionId: 'old-session'}});
    store.dispatch({type: SET_SOURCE_AND_SCREENSHOT, sourceXML, sourceJSON: xmlToJSON(sourceXML)});
    runCommand.mockReturnValue(pending.promise);
    await store.dispatch(selectElement('0'));
    vi.advanceTimersByTime(1000);
    expect(runCommand).toHaveBeenCalledTimes(1);
    await store.dispatch(quitSession({detachOnly: true}));
    await store.dispatch(openSnapshot([{size: 1000}]));
    const offlineState = store.getState();

    pending.resolve({id: 'old-element'});
    await vi.advanceTimersByTimeAsync(0);
    expect(store.getState()).toBe(offlineState);
    expect(runCommand).toHaveBeenCalledTimes(1);
  });

  it('does not show a keep-alive prompt when an old ping completes after opening a snapshot', async () => {
    const pending = Promise.withResolvers();
    const getTimeouts = vi.fn().mockReturnValue(pending.promise);
    const store = createStore({...reducer(undefined, {}), driver: {sessionId: 'old-session', getTimeouts}});
    store.dispatch(runKeepAliveLoop());
    vi.advanceTimersByTime(20_000);
    expect(getTimeouts).toHaveBeenCalledTimes(1);
    await store.dispatch(quitSession({detachOnly: true}));
    await store.dispatch(openSnapshot([{size: 1000}]));
    const offlineState = store.getState();

    vi.setSystemTime(Date.now() + 25 * 60 * 60 * 1000);
    pending.resolve({});
    await vi.advanceTimersByTimeAsync(0);
    expect(store.getState()).toBe(offlineState);
    expect(store.getState().inspector.showKeepAlivePrompt).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('safely ignores each remote command entry point without rejected promises or state changes', async () => {
    const store = createStore();
    await store.dispatch(openSnapshot([{size: 1000}]));
    const before = store.getState();
    await expect(store.dispatch(applyClientMethod({methodName: 'getPageSource'}))).resolves.toBeUndefined();
    await expect(store.dispatch(callClientMethod({methodName: 'elementClick'}))).resolves.toEqual({});
    const params = {methodName: 'getSettings'};
    await expect(store.dispatch(executeDriverCommand(params))).resolves.toEqual({});
    await expect(store.dispatch(tapElement('0'))).resolves.toBeUndefined();
    await expect(store.dispatch(searchForElement('id', 'button'))).resolves.toBeUndefined();
    await expect(store.dispatch(getFindElementsTimes([]))).resolves.toBeUndefined();
    await expect(store.dispatch(selectLocatedElement('old-element'))).resolves.toBeUndefined();
    await expect(store.dispatch(findLocatedElementInSource({}, '', null, 'old-element'))).resolves.toBeUndefined();
    await expect(store.dispatch(storeSessionSettings())).resolves.toBeUndefined();
    for (const [, getInfo] of sessionInfoGetters) {
      await expect(store.dispatch(getInfo())).resolves.toBeUndefined();
    }
    await expect(store.dispatch(getSupportedSessionMethods())).resolves.toEqual({commands: [], executeMethods: []});
    expect(store.getState()).toBe(before);
    expect(runCommand).not.toHaveBeenCalled();
    expect(params).toEqual({methodName: 'getSettings'});
    expect(log.info).not.toHaveBeenCalled();
    expect(log.warn).not.toHaveBeenCalled();
    expect(log.error).not.toHaveBeenCalled();
  });

  it('ignores session-information getters before a live driver is available', async () => {
    const store = createStore();
    const before = store.getState();

    for (const [, getInfo] of sessionInfoGetters) {
      await expect(store.dispatch(getInfo())).resolves.toBeUndefined();
    }

    expect(store.getState()).toBe(before);
    expect(runCommand).not.toHaveBeenCalled();
    expect(showError).not.toHaveBeenCalled();
    expect(log.error).not.toHaveBeenCalled();
  });

  it.each(sessionInfoGetters)('stores current live %s', async (_name, getInfo, response, stateKey, expected) => {
    const store = createStore({...reducer(undefined, {}), driver: {sessionId: 'live'}});
    runCommand.mockResolvedValue({commandRes: response});

    await store.dispatch(getInfo());

    expect(store.getState().inspector[stateKey]).toEqual(expected);
    expect(runCommand).toHaveBeenCalledOnce();
  });

  it.each(
    sessionInfoGetters.flatMap(([name, getInfo, response]) =>
      sessionTransitions.map(([destination, transition]) => [name, destination, getInfo, response, transition]),
    ),
  )('ignores late %s after switching to %s', async (_name, _destination, getInfo, response, transition) => {
    const pending = Promise.withResolvers();
    const store = createStore({...reducer(undefined, {}), driver: {sessionId: 'old'}});
    runCommand.mockReturnValue(pending.promise);
    const loading = store.dispatch(getInfo());
    await transition(store);
    const before = store.getState();

    pending.resolve({commandRes: response});
    await expect(loading).resolves.toBeUndefined();

    expect(store.getState()).toBe(before);
    expect(runCommand).toHaveBeenCalledOnce();
    expect(showError).not.toHaveBeenCalled();
    expect(log.error).not.toHaveBeenCalled();
  });

  it('preserves the capabilities fallback for a current live session', async () => {
    const store = createStore({...reducer(undefined, {}), driver: {sessionId: 'live'}});
    const flatSessionCaps = {platformName: 'Android'};
    runCommand
      .mockRejectedValueOnce(new Error('Unsupported capabilities command'))
      .mockResolvedValueOnce({commandRes: flatSessionCaps});

    await store.dispatch(getFlatSessionCaps());

    expect(runCommand.mock.calls.map(([params]) => params.methodName)).toEqual([
      'getAppiumSessionCapabilities',
      'getSession',
    ]);
    expect(store.getState().inspector.flatSessionCaps).toEqual(flatSessionCaps);
  });

  it.each(sessionTransitions)(
    'ignores a capabilities fallback completing after switching to %s',
    async (_name, transition) => {
      const pending = Promise.withResolvers();
      const fallbackStarted = Promise.withResolvers();
      const store = createStore({...reducer(undefined, {}), driver: {sessionId: 'old'}});
      runCommand.mockResolvedValueOnce({}).mockImplementationOnce(() => {
        fallbackStarted.resolve();
        return pending.promise;
      });
      const loading = store.dispatch(getFlatSessionCaps());
      await fallbackStarted.promise;
      await transition(store);
      const before = store.getState();

      pending.resolve({commandRes: {platformName: 'Old platform'}});
      await expect(loading).resolves.toBeUndefined();

      expect(store.getState()).toBe(before);
      expect(runCommand).toHaveBeenCalledTimes(2);
      expect(showError).not.toHaveBeenCalled();
    },
  );

  it('dispatches a live direct command once without refreshing or changing inspector state', async () => {
    const store = createStore({...reducer(undefined, {}), driver: {sessionId: 'live-session'}});
    const before = store.getState();
    const result = {commandRes: {pressed: true}};
    runCommand.mockResolvedValue(result);

    expect(await store.dispatch(executeDriverCommand({methodName: 'pressButton', args: ['home']}))).toBe(result);
    expect(runCommand).toHaveBeenCalledExactlyOnceWith({methodName: 'pressButton', args: ['home'], skipRefresh: true});
    expect(store.getState()).toBe(before);
    expect(log.info).toHaveBeenCalledWith({methodName: 'pressButton', args: ['home'], skipRefresh: true});
    expect(vi.getTimerCount()).toBe(0);
  });

  it('dispatches both supported-method queries and returns their results', async () => {
    const store = createStore({...reducer(undefined, {}), driver: {sessionId: 'live-session'}});
    const before = store.getState();
    const commands = {rest: {base: {'/status': {GET: {command: 'getStatus'}}}}};
    const executeMethods = {
      rest: {driver: {'mobile: pressButton': {command: 'mobilePressButton', params: [{name: 'name', required: true}]}}},
    };
    runCommand.mockImplementation(async ({methodName}) => ({
      commandRes: methodName === 'getAppiumCommands' ? commands : executeMethods,
    }));

    expect(await store.dispatch(getSupportedSessionMethods())).toEqual({commands, executeMethods});
    expect(runCommand).toHaveBeenCalledTimes(2);
    expect(runCommand).toHaveBeenCalledWith({methodName: 'getAppiumCommands', skipRefresh: true});
    expect(runCommand).toHaveBeenCalledWith({methodName: 'getAppiumExtensions', skipRefresh: true});
    expect(store.getState()).toBe(before);
  });

  it('closes a snapshot without deleting a session and allows normal session state afterward', async () => {
    const store = createStore();
    await store.dispatch(openSnapshot([{size: 1000}]));
    await store.dispatch(quitSession());
    expect(store.getState().inspector).toEqual(reducer(undefined, {}));
    expect(runCommand).not.toHaveBeenCalled();
    store.dispatch({
      type: SET_SESSION_DETAILS,
      driver: {sessionId: 'live-session'},
      featureCaps: {},
      serverDetails: {},
      sessionCaps: {},
      appMode: 'native',
    });
    expect(store.getState().inspector.isSnapshot).toBe(false);
    expect(store.getState().inspector.driver.sessionId).toBe('live-session');
  });

  it('restores live commands and polling when a new session replaces a snapshot', async () => {
    const store = createStore();
    await store.dispatch(openSnapshot([{size: 1000}]));
    const getTimeouts = vi.fn().mockResolvedValue({});
    store.dispatch({
      type: SET_SESSION_DETAILS,
      driver: {sessionId: 'live-session', getTimeouts},
      featureCaps: {},
      serverDetails: {},
      sessionCaps: {},
      appMode: 'native',
    });
    expect(store.getState().inspector.isSnapshot).toBe(false);
    expect(store.getState().inspector.snapshotCapturedAt).toBeUndefined();
    expect(store.getState().inspector.isSourceRefreshOn).toBe(true);
    runCommand.mockResolvedValue({commandRes: {alive: true}});
    expect(await store.dispatch(callClientMethod({methodName: 'status'}))).toMatchObject({commandRes: {alive: true}});
    expect(runCommand).toHaveBeenCalledTimes(1);
    store.dispatch(runKeepAliveLoop());
    await vi.advanceTimersByTimeAsync(20_000);
    expect(getTimeouts).toHaveBeenCalledTimes(1);
  });

  it('exports the displayed source and screenshot with allowlisted metadata only', async () => {
    const state = reducer(undefined, {type: LOAD_SNAPSHOT, snapshot, sourceJSON: xmlToJSON(sourceXML)});
    const store = createStore({
      ...state,
      serverDetails: {password: 'SECRET_PASSWORD'},
      sessionCaps: {accessKey: 'SECRET_KEY'},
      featureCaps: {...state.featureCaps, username: 'SECRET_USER'},
    });
    expect(store.dispatch(exportSnapshot())).toBe(true);
    expect(download).toHaveBeenCalledTimes(1);
    const [href, filename] = download.mock.calls[0];
    const [blob] = createObjectURL.mock.calls[0];
    const content = await blob.text();
    expect(parseSnapshot(content)).toEqual(snapshot);
    expect(content).not.toContain('SECRET_');
    expect(blob.type).toBe('application/json');
    expect(href).toBe('blob:snapshot');
    expect(filename).toBe('appium-snapshot-2026-10-24T12-00-00.000Z.json');
    expect(runCommand).not.toHaveBeenCalled();
    expect(revokeObjectURL).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(59_999);
    expect(revokeObjectURL).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:snapshot');
  });

  it('releases the snapshot object URL even when the download fails', async () => {
    const state = reducer(undefined, {type: LOAD_SNAPSHOT, snapshot, sourceJSON: xmlToJSON(sourceXML)});
    const store = createStore(state);
    download.mockImplementation(() => {
      throw new Error('Download failed');
    });
    expect(store.dispatch(exportSnapshot())).toBe(false);
    expect(showError).toHaveBeenCalledWith(expect.objectContaining({message: 'snapshotExportError'}));
    await vi.advanceTimersByTimeAsync(60_000);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:snapshot');
  });

  it('records the last displayed capture time rather than the later export time', async () => {
    vi.setSystemTime('2026-10-24T11:00:00.000Z');
    runCommand.mockResolvedValue({
      source: sourceXML,
      screenshot,
      windowSize: snapshot.windowSize,
    });
    const store = createStore({...reducer(undefined, {}), driver: {sessionId: 'live-session'}});
    await store.dispatch(applyClientMethod({methodName: 'getPageSource'}));
    vi.setSystemTime('2026-10-24T12:00:00.000Z');
    expect(store.dispatch(exportSnapshot())).toBe(true);
    const [blob] = createObjectURL.mock.calls[0];
    const content = await blob.text();
    expect(parseSnapshot(content).capturedAt).toBe('2026-10-24T11:00:00.000Z');
  });

  it('keeps only one keep-alive interval after repeated startup and clears it on stop', async () => {
    const getTimeouts = vi.fn().mockResolvedValue({});
    const store = createStore({...reducer(undefined, {}), driver: {sessionId: 'live', getTimeouts}});
    store.dispatch(runKeepAliveLoop());
    store.dispatch(runKeepAliveLoop());
    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(20_000);
    expect(getTimeouts).toHaveBeenCalledOnce();
    store.dispatch(killKeepAliveLoop());
    expect(vi.getTimerCount()).toBe(0);
  });

  it('ignores stale settings and saved-framework startup results after opening a snapshot', async () => {
    const settings = Promise.withResolvers();
    const framework = Promise.withResolvers();
    const store = createStore({...reducer(undefined, {}), driver: {sessionId: 'old'}});
    runCommand.mockReturnValue(settings.promise);
    vi.mocked(getSetting).mockReturnValue(framework.promise);
    const loadSettings = store.dispatch(storeSessionSettings());
    const loadFramework = store.dispatch(getSavedClientFramework());
    await store.dispatch(quitSession({detachOnly: true}));
    await store.dispatch(openSnapshot([{size: 1000}]));
    const before = store.getState();
    settings.resolve({commandRes: {oldSetting: true}});
    framework.resolve('old-framework');
    await Promise.all([loadSettings, loadFramework]);
    expect(store.getState()).toBe(before);
  });

  it('maps validation errors to translation keys without displaying raw parser messages', async () => {
    readFiles.mockResolvedValue([{content: '{'}]);
    const store = createStore();
    await expect(store.dispatch(openSnapshot([{size: 1}]))).resolves.toBe(false);
    expect(showError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'snapshotImportError: snapshotValidation.invalidJSON',
      }),
    );
  });
});
