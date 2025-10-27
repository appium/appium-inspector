import {describe, expect, it} from 'vitest';

import {
  deepFilterEmpty,
  extractParamsFromCommandPath,
  filterAvailableCommands,
} from '../../app/common/renderer/utils/commands-tab.js';

describe('utils/commands-tab.js', function () {
  describe('#deepFilterEmpty', function () {
    it('should not affect primitive values', function () {
      expect(deepFilterEmpty(false)).toEqual(false);
      expect(deepFilterEmpty(10)).toEqual(10);
      expect(deepFilterEmpty('test')).toEqual('test');
    });
    it('should return empty object or array if all its leaf values are empty', function () {
      expect(deepFilterEmpty([[], {}])).toEqual([]);
      expect(deepFilterEmpty({rest: {}, best: []})).toEqual({});
      expect(deepFilterEmpty([[[[[]]]]])).toEqual([]);
      expect(deepFilterEmpty({first: {second: {third: {fourth: {fifth: {}}}}}})).toEqual({});
    });
    it('should apply correct filtering for arrays', function () {
      const testArray = [false, [], 10, {}, 'test', [20, true, []]];
      expect(deepFilterEmpty(testArray)).toEqual([false, 10, 'test', [20, true]]);
    });
    it('should apply correct filtering for objects like ListExtensionsResponse', function () {
      const getExtsResponse = {
        rest: {
          driver: {
            'mobile: first': {},
            'mobile: second': {
              command: 'second',
              deprecated: false,
              info: 'For testing only',
              params: [],
            },
            'mobile: third': {command: '', params: [{}, {name: 'thirdParam', required: true}]},
          },
          plugins: {},
        },
      };
      expect(deepFilterEmpty(getExtsResponse)).toEqual({
        rest: {
          driver: {
            'mobile: second': {command: 'second', deprecated: false, info: 'For testing only'},
            'mobile: third': {command: '', params: [{name: 'thirdParam', required: true}]},
          },
        },
      });
    });
  });
  describe('#extractParamsFromCommandPath', function () {
    it('should return an empty array for paths without parameters', function () {
      expect(extractParamsFromCommandPath('/session')).toEqual([]);
    });
    it('should return an empty array for paths with only sessionId', function () {
      expect(extractParamsFromCommandPath('/session/:sessionId')).toEqual([]);
    });
    it('should extract all other parameters', function () {
      expect(extractParamsFromCommandPath('/session/:sessionId/element/:elementId')).toEqual([
        'elementId',
      ]);
      expect(
        extractParamsFromCommandPath(
          '/session/:sessionId/webauthn/authenticator/:authenticatorId/credentials/:credentialId',
        ),
      ).toEqual(['authenticatorId', 'credentialId']);
    });
  });
  describe('#filterAvailableCommands', function () {
    it('should return empty response if no REST command details are found', function () {
      expect(filterAvailableCommands({})).toEqual({});
      expect(filterAvailableCommands({notrest: {}})).toEqual({});
      expect(filterAvailableCommands({rest: {}})).toEqual({});
      expect(filterAvailableCommands({rest: {base: {}}})).toEqual({});
      expect(filterAvailableCommands({rest: {base: {'/status': {}}}})).toEqual({});
      expect(filterAvailableCommands({rest: {base: {'/status': {GET: {}}}}})).toEqual({});
    });
    it('should transform a basic response whose command names match those in WDIO', function () {
      const getCmdsResponse = {
        rest: {
          scope: {
            '/session/:sessionId/forward': {GET: {command: 'forward'}},
            '/session/:sessionId/appium/device/pull_file': {
              POST: {command: 'pullFile', params: [{name: 'path', required: true}]},
            },
          },
        },
      };
      expect(filterAvailableCommands(getCmdsResponse)).toEqual({
        scope: {
          forward: {command: 'forward'},
          pullFile: {command: 'pullFile', params: [{name: 'path', required: true}]},
        },
      });
    });
    it('should translate supported command names if they differ between Appium and WDIO', function () {
      const getCmdsResponse = {
        rest: {
          scope: {
            '/status': {GET: {command: 'getStatus'}},
            '/session/:sessionId/frame': {
              POST: {command: 'setFrame', params: [{name: 'id', required: true}]},
            },
          },
        },
      };
      expect(filterAvailableCommands(getCmdsResponse)).toEqual({
        scope: {
          status: {command: 'getStatus'},
          switchToFrame: {command: 'setFrame', params: [{name: 'id', required: true}]},
        },
      });
    });
    it('should filter out commands with missing or unsupported command names', function () {
      const getCmdsResponse = {
        rest: {
          scope: {
            '/status': {GET: {notcommand: 'getStatus'}},
            '/session/:sessionId/appium/commands': {GET: {command: 'notListCommands'}},
            '/session/:sessionId/appium/extensions': {GET: {command: 'listExtensions'}},
          },
        },
      };
      expect(filterAvailableCommands(getCmdsResponse)).toEqual({
        scope: {
          getAppiumExtensions: {command: 'listExtensions'},
        },
      });
    });
    it('should filter out empty command parameters', function () {
      const getCmdsResponse = {
        rest: {
          scope: {
            '/status': {GET: {command: 'getStatus', params: []}},
            '/session/:sessionId/appium/device/pull_file': {
              POST: {command: 'pullFile', params: [{}, {name: 'path', required: true}]},
            },
          },
        },
      };
      expect(filterAvailableCommands(getCmdsResponse)).toEqual({
        scope: {
          status: {command: 'getStatus'},
          pullFile: {command: 'pullFile', params: [{name: 'path', required: true}]},
        },
      });
    });
    it('should extract parameters from the command path', function () {
      const getCmdsResponse = {
        rest: {
          scope: {
            '/session/:sessionId/element/:elementId/value': {
              POST: {command: 'setValue', params: [{name: 'text', required: true}]},
            },
            '/session/:sessionId/element/:elementId/property/:name': {
              GET: {command: 'getCssProperty'},
            },
          },
        },
      };
      expect(filterAvailableCommands(getCmdsResponse)).toEqual({
        scope: {
          elementSendKeys: {
            command: 'setValue',
            params: [
              {name: 'elementId', required: true},
              {name: 'text', required: true},
            ],
          },
          getElementCSSValue: {
            command: 'getCssProperty',
            params: [
              {name: 'elementId', required: true},
              {name: 'name', required: true},
            ],
          },
        },
      });
    });
  });
});
