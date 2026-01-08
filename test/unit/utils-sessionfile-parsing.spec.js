import {describe, expect, it} from 'vitest';

import {
  DEFAULT_SESSION_NAME,
  SESSION_FILE_VERSIONS,
} from '../../app/common/renderer/constants/session-builder.js';
import {
  migrateSessionJSON,
  parseSessionFileContents,
  validateSessionJSON,
} from '../../app/common/renderer/utils/sessionfile-parsing.js';

describe('utils/sessionfile-parsing.js', function () {
  describe('#migrateSessionJSON', function () {
    it('should not migrate if already on the latest version', function () {
      const session = {version: SESSION_FILE_VERSIONS.LATEST};
      expect(migrateSessionJSON(session)).toEqual(session);
    });

    it.each([
      ['version is missing', {}],
      ['version is invalid', {version: 'invalid'}],
    ])('should return null when %s', (_desc, session) => {
      expect(migrateSessionJSON(session)).toBeNull();
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

    it.each([
      ['is missing', {}],
      ['is empty', {name: ''}],
      ['only contains whitespace', {name: '   '}],
      ['is not a string', {name: 123}],
    ])('should return null if name %s', (_desc, newNameProp) => {
      const session = {...versionProp, ...serverProp, ...capsProp, ...newNameProp};
      expect(validateSessionJSON(session)).toBeNull();
    });

    it.each([
      ['is missing', {}],
      ['is a number', {server: 123}],
      ['is an empty object', {server: {}}],
      ['has invalid property names', {server: {invalid: {}, advanced: {}}}],
      ['has non-object properties', {server: {remote: 123, advanced: {}}}],
      ['does not have the advanced property', {server: {remote: {}, local: {}}}],
    ])('should return null if server %s', (_desc, newServerProp) => {
      const session = {...versionProp, ...nameProp, ...capsProp, ...newServerProp};
      expect(validateSessionJSON(session)).toBeNull();
    });

    it.each([
      ['is not an object', 123],
      ['has unknown keys', {invalid: {}}],
      ['has non-boolean allowUnauthorized', {allowUnauthorized: 1}],
      ['has non-boolean useProxy', {useProxy: 'test'}],
      ['has non-string proxy', {proxy: false}],
    ])('should return null if advanced server %s', (_desc, newAdvancedServerProp) => {
      const session = {
        ...versionProp,
        ...nameProp,
        ...capsProp,
        server: {...serverProp.server, advanced: newAdvancedServerProp},
      };
      expect(validateSessionJSON(session)).toBeNull();
    });

    it.each([
      ['is missing', {}],
      ['is not an array', {caps: 123}],
      ['contains a non-object', {caps: [345]}],
      ['omits required fields', {caps: [{name: 'foo', value: 'bar'}]}],
      ['has an invalid type value', {caps: [{type: 'invalid', name: 'foo', value: 'bar'}]}],
    ])('should return null if caps %s', (_desc, newCapsProp) => {
      const session = {...versionProp, ...nameProp, ...serverProp, ...newCapsProp};
      expect(validateSessionJSON(session)).toBeNull();
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
