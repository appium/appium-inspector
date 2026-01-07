import {describe, expect, it} from 'vitest';

import {
  DEFAULT_SESSION_NAME,
  SESSION_FILE_VERSIONS,
} from '../../app/common/renderer/constants/session-builder.js';
import {
  migrateSessionJSON,
  parseSessionFileContents,
  validateSessionJSON,
} from '../../app/common/renderer/utils/file-handling.js';

describe('utils/file-handling.js', function () {
  describe('#migrateSessionJSON', function () {
    it('should not migrate if already on the latest version', function () {
      const session = {version: SESSION_FILE_VERSIONS.LATEST};
      expect(migrateSessionJSON(session)).toEqual(session);
    });

    it('should return null if version is missing or invalid', function () {
      expect(migrateSessionJSON({})).toBeNull();
      expect(migrateSessionJSON({version: '0.5'})).toBeNull();
    });

    describe('from v1', function () {
      it('should migrate a valid v1 session file to latest', function () {
        const v1Session = {
          version: SESSION_FILE_VERSIONS.V1,
          caps: [],
          serverType: 'remote',
          server: {
            local: {},
            remote: {path: '/test'},
            sauce: {},
            advanced: {allowUnauthorized: true},
          },
          visibleProviders: [],
        };
        expect(migrateSessionJSON(v1Session)).toEqual({
          version: SESSION_FILE_VERSIONS.LATEST,
          name: DEFAULT_SESSION_NAME,
          caps: [],
          server: {remote: {path: '/test'}, advanced: {allowUnauthorized: true}},
        });
      });

      it('should only require the serverType property', function () {
        const session1 = {
          version: SESSION_FILE_VERSIONS.V1,
          serverType: 'remote',
        };
        expect(migrateSessionJSON(session1)).toEqual({
          version: SESSION_FILE_VERSIONS.LATEST,
          name: DEFAULT_SESSION_NAME,
          server: {remote: {}, advanced: {}},
        });
        const session2 = {version: SESSION_FILE_VERSIONS.V1};
        expect(migrateSessionJSON(session2)).toBeNull();
      });

      it('should migrate empty server object', function () {
        const v1Session = {
          version: SESSION_FILE_VERSIONS.V1,
          serverType: 'any',
          server: {},
        };
        expect(migrateSessionJSON(v1Session)).toEqual({
          version: SESSION_FILE_VERSIONS.LATEST,
          name: DEFAULT_SESSION_NAME,
          server: {any: {}, advanced: {}},
        });
      });
    });
  });

  describe('#validateSessionJSON', function () {
    const versionProp = {version: SESSION_FILE_VERSIONS.LATEST};
    const nameProp = {name: 'Test'};
    const serverProp = {server: {remote: {}, advanced: {}}};
    const capsProp = {caps: []};

    it('should validate a correct v2 session', function () {
      const session = {...versionProp, ...nameProp, ...serverProp, ...capsProp};
      expect(validateSessionJSON(session)).toEqual(session);
    });

    it('should return null if name is missing or not a string', function () {
      const sessionWithoutName = {...versionProp, ...serverProp, ...capsProp};
      const sessionWithInvalidName = {...sessionWithoutName, name: 123};
      expect(validateSessionJSON(sessionWithoutName)).toBeNull();
      expect(validateSessionJSON(sessionWithInvalidName)).toBeNull();
    });

    it('should return null if server is missing or invalid', function () {
      const sessionWithoutServer = {...versionProp, ...nameProp, ...capsProp};
      const session1 = {...sessionWithoutServer, server: 123};
      const session2 = {...sessionWithoutServer, server: {}};
      const session3 = {...sessionWithoutServer, server: {invalid: {}}};
      const session4 = {...sessionWithoutServer, server: {remote: {}, local: {}}};
      expect(validateSessionJSON(sessionWithoutServer)).toBeNull();
      expect(validateSessionJSON(session1)).toBeNull();
      expect(validateSessionJSON(session2)).toBeNull();
      expect(validateSessionJSON(session3)).toBeNull();
      expect(validateSessionJSON(session4)).toBeNull();
    });

    it('should return null if advanced server properties are invalid', function () {
      const baseSession = {...versionProp, ...nameProp, ...serverProp, ...capsProp};
      const session1 = {...baseSession, server: {...baseSession.server, advanced: 123}};
      const session2 = {...baseSession, server: {...baseSession.server, advanced: {invalid: {}}}};
      const session3 = {
        ...baseSession,
        server: {...baseSession.server, advanced: {allowUnauthorized: 1}},
      };
      const session4 = {
        ...baseSession,
        server: {...baseSession.server, advanced: {useProxy: 'test'}},
      };
      const session5 = {...baseSession, server: {...baseSession.server, advanced: {proxy: false}}};
      expect(validateSessionJSON(session1)).toBeNull();
      expect(validateSessionJSON(session2)).toBeNull();
      expect(validateSessionJSON(session3)).toBeNull();
      expect(validateSessionJSON(session4)).toBeNull();
      expect(validateSessionJSON(session5)).toBeNull();
    });

    it('should return null if caps is missing, not array, or invalid', function () {
      const sessionWithoutCaps = {...versionProp, ...nameProp, ...serverProp};
      const session1 = {...sessionWithoutCaps, caps: 123};
      const session2 = {...sessionWithoutCaps, caps: [{name: 'foo', value: 'bar'}]};
      const session3 = {
        ...sessionWithoutCaps,
        caps: [{type: 'invalid', name: 'foo', value: 'bar'}],
      };
      expect(validateSessionJSON(sessionWithoutCaps)).toBeNull();
      expect(validateSessionJSON(session1)).toBeNull();
      expect(validateSessionJSON(session2)).toBeNull();
      expect(validateSessionJSON(session3)).toBeNull();
    });
  });

  describe('#parseSessionFileContents', function () {
    it('should return null for invalid JSON', function () {
      expect(parseSessionFileContents('not json')).toBeNull();
    });

    it('should work for a valid v1 session file', function () {
      const v1 = JSON.stringify({
        version: SESSION_FILE_VERSIONS.V1,
        caps: [
          {
            type: 'text',
            name: 'platformName',
            value: 'Android',
          },
        ],
        server: {
          local: {},
          remote: {
            path: '',
          },
          advanced: {},
          sauce: {
            dataCenter: 'us-west-1',
          },
          headspin: {},
          browserstack: {},
          lambdatest: {},
          testingbot: {},
          experitest: {},
          roboticmobi: {},
          remotetestkit: {},
          bitbar: {},
          kobiton: {},
          perfecto: {},
          pcloudy: {},
          mobitru: {},
          tvlabs: {},
          testcribe: {},
          webmate: {},
          fireflinkdevicefarm: {},
        },
        serverType: 'remote',
        visibleProviders: [],
      });
      const result = parseSessionFileContents(v1);
      expect(result).toEqual({
        version: 2,
        name: DEFAULT_SESSION_NAME,
        caps: [
          {
            type: 'text',
            name: 'platformName',
            value: 'Android',
          },
        ],
        server: {remote: {path: ''}, advanced: {}},
      });
    });

    it('should work for a valid v2 session file', function () {
      const sessionFile = {
        version: SESSION_FILE_VERSIONS.V2,
        name: 'Example Session',
        caps: [
          {
            type: 'text',
            name: 'platformName',
            value: 'Android',
          },
        ],
        server: {remote: {}, advanced: {}},
      };
      const parsedJson = parseSessionFileContents(JSON.stringify(sessionFile));
      expect(parsedJson).toEqual(sessionFile);
    });
  });
});
