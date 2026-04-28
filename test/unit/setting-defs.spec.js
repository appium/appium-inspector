import {beforeEach, describe, expect, it, vi} from 'vitest';

const ALL_PARAMS_URL =
  'http://localhost/?remoteHost=myhost&remotePort=4723&remotePath=/wd/hub&sessionId=abc123';
const MISSING_PARAM_URL = 'http://localhost/?remoteHost=myhost&remotePort=4723&remotePath=/wd/hub';
const NO_PARAMS_URL = 'http://localhost/';

function stubWindow(href) {
  vi.stubGlobal('window', {location: {href}, AppLiveSessionId: null});
}

describe('setting-defs.js', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  describe('#checkIfAllParamsPresent', () => {
    it('returns true and sets window.AppLiveSessionId when all 4 params are present', async () => {
      stubWindow(ALL_PARAMS_URL);
      const {checkIfAllParamsPresent} = await import('../../app/common/shared/setting-defs.js');
      expect(checkIfAllParamsPresent()).toBe(true);
      expect(window.AppLiveSessionId).toBe('abc123');
    });

    it('returns false when any one param is missing', async () => {
      stubWindow(MISSING_PARAM_URL);
      const {checkIfAllParamsPresent} = await import('../../app/common/shared/setting-defs.js');
      expect(checkIfAllParamsPresent()).toBe(false);
    });

    it('returns false and sets AppLiveSessionId to null when no params present', async () => {
      stubWindow(NO_PARAMS_URL);
      const {checkIfAllParamsPresent} = await import('../../app/common/shared/setting-defs.js');
      expect(checkIfAllParamsPresent()).toBe(false);
      expect(window.AppLiveSessionId).toBeNull();
    });
  });

  describe('DEFAULT_SETTINGS[SESSION_SERVER_PARAMS]', () => {
    it('pre-fills server params when all 4 URL params are present', async () => {
      stubWindow(ALL_PARAMS_URL);
      const {DEFAULT_SETTINGS, SESSION_SERVER_PARAMS} = await import(
        '../../app/common/shared/setting-defs.js'
      );
      expect(DEFAULT_SETTINGS[SESSION_SERVER_PARAMS]).toEqual({
        remote: {ssl: true, hostname: 'myhost', port: '4723', path: '/wd/hub'},
      });
    });

    it('is null when URL params are absent', async () => {
      stubWindow(NO_PARAMS_URL);
      const {DEFAULT_SETTINGS, SESSION_SERVER_PARAMS} = await import(
        '../../app/common/shared/setting-defs.js'
      );
      expect(DEFAULT_SETTINGS[SESSION_SERVER_PARAMS]).toBeNull();
    });
  });
});

describe('constants/common.js — AppLive event strings', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('INSTRUMENTATION_WINDOW_MESSAGE_EVENT preserves intentional "Inspecor" typo', async () => {
    const {INSTRUMENTATION_WINDOW_MESSAGE_EVENT} = await import(
      '../../app/common/renderer/constants/common.js'
    );
    // browserstack-fe listeners key on this exact string — must not be silently corrected
    expect(INSTRUMENTATION_WINDOW_MESSAGE_EVENT).toBe('InteractionWithAppiumInspecor');
  });

  it('NORMAL_WINDOW_MESSAGE_EVENT is AppLiveAppiumInspector', async () => {
    const {NORMAL_WINDOW_MESSAGE_EVENT} = await import(
      '../../app/common/renderer/constants/common.js'
    );
    expect(NORMAL_WINDOW_MESSAGE_EVENT).toBe('AppLiveAppiumInspector');
  });

  it('API_METHOD_INSTRUMENTATION_WINDOW_MESSAGE_EVENT has :apiMethod suffix', async () => {
    const {
      INSTRUMENTATION_WINDOW_MESSAGE_EVENT,
      API_METHOD_INSTRUMENTATION_WINDOW_MESSAGE_EVENT,
    } = await import('../../app/common/renderer/constants/common.js');
    expect(API_METHOD_INSTRUMENTATION_WINDOW_MESSAGE_EVENT).toBe(
      `${INSTRUMENTATION_WINDOW_MESSAGE_EVENT}:apiMethod`,
    );
  });
});
