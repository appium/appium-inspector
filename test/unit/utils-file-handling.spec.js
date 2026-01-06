import {describe, expect, it} from 'vitest';

import {parseSessionFileContents} from '../../app/common/renderer/utils/file-handling.js';

describe('utils/file-handling.js', function () {
  describe('#parseSessionFileContents', function () {
    describe('no version', function () {
      it('should not parse invalid JSON', function () {
        const sessionString = 'this is not JSON';
        expect(parseSessionFileContents(sessionString)).toBeNull();
      });

      it('should not parse if the version property is missing', function () {
        const sessionString = `{
          "caps": [],
          "serverType": "remote"
        }`;
        expect(parseSessionFileContents(sessionString)).toBeNull();
      });
    });

    describe('any version', function () {
      it('should not parse if the caps property is missing', function () {
        const sessionString = `{
          "version": "any",
          "serverType": "remote"
        }`;
        expect(parseSessionFileContents(sessionString)).toBeNull();
      });

      it('should not parse if caps is not an array', function () {
        const sessionString = `{
          "version": "any",
          "caps": 9999,
          "serverType": "remote"
        }`;
        expect(parseSessionFileContents(sessionString)).toBeNull();
      });

      it('should not parse if any required capability property is missing', function () {
        const sessionString = `{
          "version": "any",
          "caps": [
            {
              "name": "single cap"
            }
          ],
          "serverType": "remote"
        }`;
        expect(parseSessionFileContents(sessionString)).toBeNull();
      });

      it('should not parse if any capability type is not valid', function () {
        const sessionString = `{
          "version": "any",
          "caps": [
            {
              "type": "invalid type",
              "name": "single cap",
              "value": "single cap value"
            }
          ],
          "serverType": "remote"
        }`;
        expect(parseSessionFileContents(sessionString)).toBeNull();
      });
    });

    describe('version 1', function () {
      it('should parse a fully formed session file', function () {
        const sessionString = `{
          "version": "1.0",
          "caps": [
            {
              "type": "text",
              "name": "platformName",
              "value": "Android"
            }
          ],
          "server": {
            "local": {},
            "remote": {
              "path": ""
            },
            "sauce": {
              "dataCenter": "us-west-1"
            },
            "headspin": {},
            "browserstack": {},
            "lambdatest": {},
            "advanced": {},
            "bitbar": {},
            "kobiton": {},
            "perfecto": {},
            "pcloudy": {},
            "testingbot": {},
            "experitest": {},
            "roboticmobi": {},
            "remotetestkit": {}
          },
          "serverType": "remote",
          "visibleProviders": []
        }`;
        const expectedSessionJSON = {
          version: '1.0',
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
            sauce: {
              dataCenter: 'us-west-1',
            },
            headspin: {},
            browserstack: {},
            lambdatest: {},
            advanced: {},
            bitbar: {},
            kobiton: {},
            perfecto: {},
            pcloudy: {},
            testingbot: {},
            experitest: {},
            roboticmobi: {},
            remotetestkit: {},
          },
          serverType: 'remote',
          visibleProviders: [],
        };
        expect(parseSessionFileContents(sessionString)).toEqual(expectedSessionJSON);
      });

      it('should parse a minimum valid session file', function () {
        const sessionString = `{
          "version": "1.0",
          "caps": [],
          "serverType": "remote"
        }`;
        const expectedSessionJSON = {
          version: '1.0',
          caps: [],
          serverType: 'remote',
        };
        expect(parseSessionFileContents(sessionString)).toEqual(expectedSessionJSON);
      });

      it('should not parse if serverType is invalid', function () {
        const sessionString = `{
          "version": "1.0",
          "caps": [],
          "serverType": "some other server"
        }`;
        expect(parseSessionFileContents(sessionString)).toBeNull();
      });
    });

    describe('version 2', function () {
      it('should parse a fully formed session file', function () {
        const sessionString = `{
          "version": "2.0",
          "name": "Test Session",
          "server": {
            "remote": {
              "path": ""
            }
          },
          "caps": [
            {
              "type": "text",
              "name": "platformName",
              "value": "Android"
            }
          ]
        }`;
        const expectedSessionJSON = {
          version: '2.0',
          name: 'Test Session',
          server: {
            remote: {
              path: '',
            },
          },
          caps: [
            {
              type: 'text',
              name: 'platformName',
              value: 'Android',
            },
          ],
        };
        expect(parseSessionFileContents(sessionString)).toEqual(expectedSessionJSON);
      });

      it('should parse a minimum valid session file', function () {
        const sessionString = `{
          "version": "2.0",
          "name": "Test Session",
          "server": {
            "remote": {}
          },
          "caps": []
        }`;
        const expectedSessionJSON = {
          version: '2.0',
          name: 'Test Session',
          server: {
            remote: {},
          },
          caps: [],
        };
        expect(parseSessionFileContents(sessionString)).toEqual(expectedSessionJSON);
      });

      it('should not parse if name or server is missing', function () {
        const sessionString1 = `{
          "version": "2.0",
          "name": "Test Session",
          "caps": []
        }`;
        const sessionString2 = `{
          "version": "2.0",
          "server": {
            "remote": {},
          },
          "caps": []
        }`;
        expect(parseSessionFileContents(sessionString1)).toBeNull();
        expect(parseSessionFileContents(sessionString2)).toBeNull();
      });
      it('should not parse if the server type is invalid', function () {
        const sessionString = `{
          "version": "2.0",
          "name": "Test Session",
          "server": {
            "some other server": {}
          },
          "caps": []
        }`;
        expect(parseSessionFileContents(sessionString)).toBeNull();
      });
    });
  });
});
