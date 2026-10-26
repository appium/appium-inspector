import path from 'node:path';

import {startServer as startAppiumFakeDriverServer} from '@appium/fake-driver';
import {afterAll, afterEach, beforeAll, describe, expect, it, vi} from 'vitest';

import {compareLocators} from '../../app/common/renderer/actions/SessionInspector.js';
import InspectorDriver from '../../app/common/renderer/lib/appium/inspector-driver.js';
import WDSessionStarter from '../../app/common/renderer/lib/appium/session-starter.js';

vi.mock('../../app/common/renderer/utils/logger.js', () => ({log: {debug: vi.fn(), error: vi.fn(), info: vi.fn()}}));
vi.mock('i18next', () => ({default: {isInitialized: true, use: vi.fn().mockReturnThis(), init: vi.fn()}}));
vi.mock('../../app/common/renderer/polyfills.js', () => ({
  setSetting: vi.fn(),
  getSetting: vi.fn(),
  openLink: vi.fn(),
  setTheme: vi.fn(),
  updateLanguage: vi.fn(),
  localesPath: '',
  loadSessionFileIfOpened: vi.fn(),
}));

const queries = () => [
  {strategy: 'xpath', selector: '//MockListItem'},
  {strategy: 'xpath', selector: '//MockListItem[1]'},
];

describe('Locator comparison through the actual Inspector action and FakeDriver', () => {
  let driver;
  let server;

  beforeAll(async () => {
    InspectorDriver.clearInstance();
    server = await startAppiumFakeDriverServer(12122, '127.0.0.1');
    driver = await WDSessionStarter.newSession(
      {hostname: '127.0.0.1', port: 12122, path: '/', connectionRetryCount: 0},
      {
        platformName: 'Fake',
        'appium:deviceName': 'Fake',
        'appium:app': path.resolve(__dirname, '..', 'fixtures', 'fake-app.xml'),
      },
    );
  });
  afterEach(() => vi.restoreAllMocks());
  afterAll(async () => {
    try {
      await driver?.deleteSession();
    } finally {
      await server?.close();
      InspectorDriver.clearInstance();
    }
  });

  const state = () => ({inspector: {driver, currentContext: 'NATIVE_APP', isRecording: true}});

  it('runs both searches, returns actual element IDs and times, and does not record or refresh', async () => {
    const dispatch = vi.fn();
    const find = vi.spyOn(driver, 'findElements');
    const source = vi.spyOn(driver, 'getPageSource');
    const screenshot = vi.spyOn(driver, 'takeScreenshot');
    const results = await compareLocators(queries())(dispatch, state);
    expect(find.mock.calls).toEqual([
      ['xpath', '//MockListItem'],
      ['xpath', '//MockListItem[1]'],
    ]);
    expect(results.map(({elementIds}) => elementIds.length)).toEqual([3, 1]);
    expect(results[1].elementIds).toEqual([results[0].elementIds[0]]);
    for (const result of results) {
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(result.executionTime)).toBe(true);
      expect(result).not.toHaveProperty('error');
    }
    expect(source).not.toHaveBeenCalled();
    expect(screenshot).not.toHaveBeenCalled();
    expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual([
      'HIDE_PROMPT_KEEP_ALIVE',
      'SET_LAST_ACTIVE_MOMENT',
    ]);
  });

  it('reports an actual bad strategy without losing the successful second search', async () => {
    const results = await compareLocators([{strategy: 'not-a-strategy', selector: 'input'}, queries()[1]])(
      vi.fn(),
      state,
    );
    expect(results[0].error).toBeTruthy();
    expect(results[0]).not.toHaveProperty('executionTime');
    expect(results[1].elementIds).toHaveLength(1);
    expect(results[1].executionTime).toBeGreaterThanOrEqual(0);
  });

  it('returns a real zero-match result instead of treating it as a failed search', async () => {
    const results = await compareLocators([{strategy: 'xpath', selector: '//DoesNotExist'}, queries()[0]])(
      vi.fn(),
      state,
    );
    expect(results[0].elementIds).toEqual([]);
    expect(results[0].executionTime).toBeGreaterThanOrEqual(0);
    expect(results[0]).not.toHaveProperty('error');
    expect(results[1].elementIds).toHaveLength(3);
  });

  it.each(['abort', 'driver', 'context'])(
    'discards a stale comparison after the first real request (%s)',
    async (change) => {
      const current = state();
      const controller = new AbortController();
      const originalFind = driver.findElements.bind(driver);
      const find = vi.spyOn(driver, 'findElements').mockImplementation(async (...args) => {
        const result = await originalFind(...args);
        if (change === 'abort') {
          controller.abort();
        }
        if (change === 'driver') {
          current.inspector.driver = {};
        }
        if (change === 'context') {
          current.inspector.currentContext = 'WEBVIEW_1';
        }
        return result;
      });
      expect(await compareLocators(queries(), controller.signal)(vi.fn(), () => current)).toBeNull();
      expect(find).toHaveBeenCalledTimes(1);
    },
  );

  it('captures both inputs before an in-flight request so caller edits do not change the second query', async () => {
    const input = queries();
    const originalFind = driver.findElements.bind(driver);
    const find = vi.spyOn(driver, 'findElements').mockImplementation(async (...args) => {
      input[1].selector = '//DoesNotExist';
      return await originalFind(...args);
    });
    const results = await compareLocators(input)(vi.fn(), state);
    expect(find).toHaveBeenNthCalledWith(2, 'xpath', '//MockListItem[1]');
    expect(results[1].selector).toBe('//MockListItem[1]');
    expect(results[1].elementIds).toHaveLength(1);
  });
});
