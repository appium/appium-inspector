import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import * as SessionBuilderActions from '../../app/common/renderer/actions/SessionBuilder.js';
import {SERVER_TYPES} from '../../app/common/renderer/constants/session-builder.js';
import {DEFAULT_SERVER_PROPS} from '../../app/common/renderer/constants/webdriver.js';

vi.mock('../../app/common/renderer/utils/logger.js', () => ({
  log: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));
vi.mock('i18next', () => ({
  default: {
    isInitialized: true,
    use: vi.fn().mockReturnThis(),
    init: vi.fn(),
  },
}));
vi.mock('../../app/common/renderer/polyfills.js', () => ({
  setSetting: vi.fn(() => Promise.resolve()),
  getSetting: vi.fn(() => Promise.resolve(null)),
  openLink: vi.fn(),
  setTheme: vi.fn(),
  updateLanguage: vi.fn(),
  ipcRenderer: {
    on: vi.fn(),
    invoke: vi.fn(),
    send: vi.fn(),
  },
  i18NextBackend: {
    type: 'backend',
    init: vi.fn(),
    read: vi.fn(),
  },
  i18NextBackendOptions: {
    backends: [],
    backendOptions: [],
  },
}));

describe('SessionBuilder actions', function () {
  describe('#setPortFromUrl', function () {
    let mockDispatch, mockGetState, originalWindow, originalURL;

    beforeEach(() => {
      mockDispatch = vi.fn();
      mockGetState = vi.fn();
      originalWindow = global.window;
      originalURL = global.URL;
    });

    afterEach(() => {
      global.window = originalWindow;
      global.URL = originalURL;
      vi.restoreAllMocks();
    });

    it('should extract and set port from URL when accessing via /inspector path', async function () {
      const mockState = {
        builder: {
          server: {
            [SERVER_TYPES.REMOTE]: {
              hostname: '127.0.0.1',
              port: DEFAULT_SERVER_PROPS.port,
            },
          },
          serverType: SERVER_TYPES.REMOTE,
        },
      };

      mockGetState.mockReturnValue(mockState);

      global.window = {
        location: {
          href: 'http://localhost:1234/inspector',
          pathname: '/inspector',
        },
      };

      const action = SessionBuilderActions.setPortFromUrl();
      await action(mockDispatch, mockGetState);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_SERVER_PARAM',
        serverType: SERVER_TYPES.REMOTE,
        name: 'port',
        value: '1234',
      });
    });

    it('should extract and set port from default port URL', async function () {
      const mockState = {
        builder: {
          server: {
            [SERVER_TYPES.REMOTE]: {
              hostname: '127.0.0.1',
            },
          },
          serverType: SERVER_TYPES.REMOTE,
        },
      };

      mockGetState.mockReturnValue(mockState);

      global.window = {
        location: {
          href: 'http://localhost:4723/inspector',
          pathname: '/inspector',
        },
      };

      const action = SessionBuilderActions.setPortFromUrl();
      await action(mockDispatch, mockGetState);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_SERVER_PARAM',
        serverType: SERVER_TYPES.REMOTE,
        name: 'port',
        value: '4723',
      });
    });

    it('should not set port if window is undefined (electron mode)', async function () {
      global.window = undefined;

      const action = SessionBuilderActions.setPortFromUrl();
      await action(mockDispatch, mockGetState);

      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should not set port if window.location is undefined', async function () {
      global.window = {};

      const action = SessionBuilderActions.setPortFromUrl();
      await action(mockDispatch, mockGetState);

      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should not set port if URL has no port specified', async function () {
      const mockState = {
        builder: {
          server: {
            [SERVER_TYPES.REMOTE]: {
              hostname: '127.0.0.1',
            },
          },
          serverType: SERVER_TYPES.REMOTE,
        },
      };

      mockGetState.mockReturnValue(mockState);

      global.window = {
        location: {
          href: 'http://localhost/inspector',
          pathname: '/inspector',
        },
      };

      const action = SessionBuilderActions.setPortFromUrl();
      await action(mockDispatch, mockGetState);

      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should handle invalid port numbers gracefully', async function () {
      const mockState = {
        builder: {
          server: {
            [SERVER_TYPES.REMOTE]: {
              hostname: '127.0.0.1',
            },
          },
          serverType: SERVER_TYPES.REMOTE,
        },
      };

      mockGetState.mockReturnValue(mockState);

      const OriginalURL = global.URL;
      global.URL = class extends OriginalURL {
        constructor(input) {
          super(input);
          if (input.includes('invalid')) {
            Object.defineProperty(this, 'port', {
              get() {
                return 'invalid';
              },
              configurable: true,
            });
          }
        }
      };

      global.window = {
        location: {
          href: 'http://localhost:invalid/inspector',
          pathname: '/inspector',
        },
      };

      const action = SessionBuilderActions.setPortFromUrl();
      await action(mockDispatch, mockGetState);

      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should handle port numbers outside valid range', async function () {
      const mockState = {
        builder: {
          server: {
            [SERVER_TYPES.REMOTE]: {
              hostname: '127.0.0.1',
            },
          },
          serverType: SERVER_TYPES.REMOTE,
        },
      };

      mockGetState.mockReturnValue(mockState);

      global.window = {
        location: {
          href: 'http://localhost:70000/inspector',
          pathname: '/inspector',
        },
      };

      const action = SessionBuilderActions.setPortFromUrl();
      await action(mockDispatch, mockGetState);

      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });
});
