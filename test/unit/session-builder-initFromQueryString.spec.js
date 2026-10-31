import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('../../app/common/renderer/utils/logger.js', () => ({
  log: {debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn()},
}));
vi.mock('i18next', () => ({
  default: {
    isInitialized: true,
    use: vi.fn().mockReturnThis(),
    init: vi.fn(),
    t: (key) => key,
  },
}));
vi.mock('../../app/common/renderer/polyfills.js', () => ({
  setSetting: vi.fn(() => Promise.resolve()),
  getSetting: vi.fn(() => Promise.resolve(null)),
  openLink: vi.fn(),
  setTheme: vi.fn(),
  updateLanguage: vi.fn(),
  localesPath: '',
  loadSessionFileIfOpened: vi.fn().mockResolvedValue(null),
}));

const CAPS = [{type: 'text', name: 'platformName', value: 'Android'}];
const SAVED_SAUCE = {username: 'saved-user', accessKey: 'saved-key', dataCenter: 'us-west-1'};

// initFromQueryString only runs once per module instance, so each test loads fresh modules and
// runs the thunk against the real reducer, starting from saved Sauce Labs credentials
async function runWithUrl(search) {
  vi.resetModules();
  const actions = await import('../../app/common/renderer/actions/SessionBuilder.js');
  const {default: builder} = await import('../../app/common/renderer/reducers/SessionBuilder.js');

  let state = builder(undefined, {type: '@@INIT'});
  state = builder(state, {type: actions.SET_SERVER, server: {sauce: SAVED_SAUCE}, serverType: 'sauce'});
  const dispatch = (action) => {
    state = builder(state, action);
  };
  const getState = () => ({builder: state});

  global.window = {location: {href: `http://localhost:4723/inspector${search}`}};
  const loadNewSession = vi.fn();
  actions.initFromQueryString(loadNewSession)(dispatch, getState);
  return {state, loadNewSession};
}

describe('SessionBuilder actions', function () {
  describe('#initFromQueryString', function () {
    let originalWindow;

    // The first import of the actions module transforms its whole dependency graph; do it once
    // up front so the per-test fresh imports below stay within the default timeout
    beforeAll(async () => {
      await import('../../app/common/renderer/actions/SessionBuilder.js');
      await import('../../app/common/renderer/reducers/SessionBuilder.js');
    }, 60_000);

    beforeEach(() => {
      originalWindow = global.window;
    });

    afterEach(() => {
      global.window = originalWindow;
    });

    it('should replace the saved server state with the state from the URL', async function () {
      const urlState = {caps: CAPS, serverType: 'remote', server: {remote: {hostname: 'grid.example'}}};
      const {state} = await runWithUrl(`?state=${encodeURIComponent(JSON.stringify(urlState))}`);
      expect(state.serverType).toBe('remote');
      expect(state.server.remote.hostname).toBe('grid.example');
      expect(state.server.sauce).not.toHaveProperty('username');
      expect(state.server.sauce).not.toHaveProperty('accessKey');
      expect(state.caps).toEqual(CAPS);
    });

    it('should not keep a saved cloud server type when the URL does not set one', async function () {
      const {state} = await runWithUrl(`?state=${encodeURIComponent(JSON.stringify({caps: CAPS}))}`);
      expect(state.serverType).not.toBe('sauce');
      expect(state.server.sauce).not.toHaveProperty('accessKey');
    });

    it('should not let the URL select a cloud vendor', async function () {
      const urlState = {
        caps: CAPS,
        serverType: 'sauce',
        server: {sauce: {useSCProxy: true, scHost: 'attacker.example'}},
      };
      const {state} = await runWithUrl(`?state=${encodeURIComponent(JSON.stringify(urlState))}`);
      expect(state.serverType).not.toBe('sauce');
      expect(state.server.sauce).not.toHaveProperty('scHost');
    });

    it('should auto-start a session described by the URL without asking', async function () {
      const urlState = {caps: CAPS, serverType: 'remote', server: {remote: {hostname: 'grid.example'}}};
      const {loadNewSession} = await runWithUrl(`?state=${encodeURIComponent(JSON.stringify(urlState))}&autoStart=1`);
      expect(loadNewSession).toHaveBeenCalledWith(CAPS);
    });

    it('should not auto-start on the saved server when the URL carries no state', async function () {
      const {state, loadNewSession} = await runWithUrl('?autoStart=1');
      expect(loadNewSession).not.toHaveBeenCalled();
      expect(state.server.sauce).toMatchObject(SAVED_SAUCE);
    });
  });
});
