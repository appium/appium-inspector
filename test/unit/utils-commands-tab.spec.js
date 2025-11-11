import {describe, expect, it} from 'vitest';

import {
  adjustParamValueType,
  deepFilterEmpty,
  extractParamsFromCommandPath,
  filterMethodPairs,
  transformCommandsMap,
  transformExecMethodsMap,
} from '../../app/common/renderer/utils/commands-tab.js';

describe('utils/commands-tab.js', function () {
  describe('#adjustParamValueType', function () {
    it('should detect the correct type for common examples', function () {
      expect(adjustParamValueType('test')).toEqual('test');
      expect(adjustParamValueType('109')).toEqual(109);
      expect(adjustParamValueType('true')).toEqual(true);
      expect(adjustParamValueType('false')).toEqual(false);
      expect(adjustParamValueType('null')).toEqual(null);
      expect(adjustParamValueType('[1, 2, 3]')).toEqual([1, 2, 3]);
      expect(adjustParamValueType('{"a":1}')).toEqual({a: 1});
    });
    it('should detect the correct type for edge cases', function () {
      // Leading zero numeric string should be left as string
      expect(adjustParamValueType('01')).toEqual('01');
      // Empty string -> null
      expect(adjustParamValueType('')).toEqual(null);
      // Invalid arrays/JSON stay as string
      expect(adjustParamValueType('[invalid,]')).toEqual('[invalid,]');
      expect(adjustParamValueType('{invalid:}')).toEqual('{invalid:}');
    });
  });

  describe('#filterMethodPairs', function () {
    it('should return the same array if the search query is empty', function () {
      const methodPairs = [['method', {command: 'test'}]];
      expect(filterMethodPairs(methodPairs, '')).toEqual([['method', {command: 'test'}]]);
    });
    it('should filter the array to methods that match the search query', function () {
      const methodPairs = [
        ['method1', {command: 'test'}],
        ['method2', {command: 'rest'}],
      ];
      expect(filterMethodPairs(methodPairs, 'hod2')).toEqual([['method2', {command: 'rest'}]]);
      expect(filterMethodPairs(methodPairs, 'method1')).toEqual([['method1', {command: 'test'}]]);
      expect(filterMethodPairs(methodPairs, 'somethingelse')).toEqual([]);
    });
  });

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

  describe('#transformCommandsMap', function () {
    it('should return empty array if no REST command details are found', function () {
      expect(transformCommandsMap({})).toEqual([]);
      expect(transformCommandsMap({notrest: {}})).toEqual([]);
      expect(transformCommandsMap({rest: {}})).toEqual([]);
      expect(transformCommandsMap({rest: {base: {}}})).toEqual([]);
      expect(transformCommandsMap({rest: {base: {'/status': {}}}})).toEqual([]);
      expect(transformCommandsMap({rest: {base: {'/status': {GET: {}}}}})).toEqual([]);
    });
    it('should transform a basic response whose command names match those in WDIO', function () {
      const getCmdsResponse = {
        rest: {
          base: {
            '/session/:sessionId/forward': {GET: {command: 'forward'}},
            '/session/:sessionId/appium/device/pull_file': {
              POST: {command: 'pullFile', params: [{name: 'path', required: true}]},
            },
          },
        },
      };
      expect(transformCommandsMap(getCmdsResponse)).toEqual([
        ['forward', {command: 'forward'}],
        ['pullFile', {command: 'pullFile', params: [{name: 'path', required: true}]}],
      ]);
    });
    it('should translate supported command names if they differ between Appium and WDIO', function () {
      const getCmdsResponse = {
        rest: {
          base: {
            '/status': {GET: {command: 'getStatus'}},
            '/session/:sessionId/frame': {
              POST: {command: 'setFrame', params: [{name: 'id', required: true}]},
            },
          },
        },
      };
      expect(transformCommandsMap(getCmdsResponse)).toEqual([
        ['status', {command: 'getStatus'}],
        ['switchToFrame', {command: 'setFrame', params: [{name: 'id', required: true}]}],
      ]);
    });
    it('should filter out commands with missing or unsupported command names', function () {
      const getCmdsResponse = {
        rest: {
          base: {
            '/status': {GET: {notcommand: 'getStatus'}},
            '/session/:sessionId/appium/commands': {GET: {command: 'notListCommands'}},
            '/session': {POST: {command: 'createSession'}},
            '/session/:sessionId/appium/extensions': {GET: {command: 'listExtensions'}},
          },
        },
      };
      expect(transformCommandsMap(getCmdsResponse)).toEqual([
        ['getAppiumExtensions', {command: 'listExtensions'}],
      ]);
    });
    it('should filter out empty command parameters', function () {
      const getCmdsResponse = {
        rest: {
          base: {
            '/status': {GET: {command: 'getStatus', params: []}},
            '/session/:sessionId/appium/device/pull_file': {
              POST: {command: 'pullFile', params: [{}, {name: 'path', required: true}]},
            },
          },
        },
      };
      expect(transformCommandsMap(getCmdsResponse)).toEqual([
        ['status', {command: 'getStatus'}],
        ['pullFile', {command: 'pullFile', params: [{name: 'path', required: true}]}],
      ]);
    });
    it('should extract parameters from the command path', function () {
      const getCmdsResponse = {
        rest: {
          base: {
            '/session/:sessionId/element/:elementId/value': {
              POST: {command: 'setValue', params: [{name: 'text', required: true}]},
            },
            '/session/:sessionId/element/:elementId/property/:name': {
              GET: {command: 'getCssProperty'},
            },
          },
        },
      };
      expect(transformCommandsMap(getCmdsResponse)).toEqual([
        [
          'elementSendKeys',
          {
            command: 'setValue',
            params: [
              {name: 'elementId', required: true},
              {name: 'text', required: true},
            ],
          },
        ],
        [
          'getElementCSSValue',
          {
            command: 'getCssProperty',
            params: [
              {name: 'elementId', required: true},
              {name: 'name', required: true},
            ],
          },
        ],
      ]);
    });
    it('should merge commands from all scopes into one', function () {
      const getCmdsResponse = {
        rest: {
          base: {
            '/status': {GET: {command: 'getStatus'}},
          },
          driver: {
            '/session/:sessionId/appium/commands': {GET: {command: 'listCommands'}},
          },
          plugins: {
            plugin1: {
              '/session/:sessionId/appium/extensions': {GET: {command: 'listExtensions'}},
            },
            plugin2: {
              '/session/:sessionId/forward': {POST: {command: 'forward'}},
            },
          },
        },
      };
      expect(transformCommandsMap(getCmdsResponse)).toEqual([
        ['status', {command: 'getStatus'}],
        ['getAppiumCommands', {command: 'listCommands'}],
        ['getAppiumExtensions', {command: 'listExtensions'}],
        ['forward', {command: 'forward'}],
      ]);
    });
    it('should prefer driver commands over base commands in case of overrides', function () {
      const getCmdsResponse = {
        rest: {
          base: {
            '/session/:sessionId/forward': {POST: {command: 'forward', info: 'from-base'}},
          },
          driver: {
            '/session/:sessionId/forward': {POST: {command: 'forward', info: 'from-driver'}},
          },
        },
      };
      expect(transformCommandsMap(getCmdsResponse)).toEqual([
        ['forward', {command: 'forward', info: 'from-driver'}],
      ]);
    });
    it('should prefer plugin commands over driver commands in case of overrides', function () {
      const getCmdsResponse = {
        rest: {
          driver: {
            '/session/:sessionId/forward': {POST: {command: 'forward', info: 'from-driver'}},
          },
          plugins: {
            pluginA: {
              '/session/:sessionId/forward': {POST: {command: 'forward', info: 'from-plugin'}},
            },
          },
        },
      };
      expect(transformCommandsMap(getCmdsResponse)).toEqual([
        ['forward', {command: 'forward', info: 'from-plugin'}],
      ]);
    });
    it('should not apply intra-source overrides using deprecated methods', function () {
      const getCmdsResponse = {
        rest: {
          base: {
            '/session/:sessionId/forward_1': {
              POST: {command: 'forward', info: 'forward-supported'},
            },
            '/session/:sessionId/forward_2': {
              POST: {command: 'forward', deprecated: true, info: 'forward-deprecated'},
            },
          },
        },
      };
      expect(transformCommandsMap(getCmdsResponse)).toEqual([
        ['forward', {command: 'forward', info: 'forward-supported'}],
      ]);
    });
  });

  describe('#transformExecMethodsMap', function () {
    it('should return empty response if no REST method details are found', function () {
      expect(transformExecMethodsMap({})).toEqual([]);
      expect(transformExecMethodsMap({notrest: {}})).toEqual([]);
      expect(transformExecMethodsMap({rest: {}})).toEqual([]);
      expect(transformExecMethodsMap({rest: {driver: {}}})).toEqual([]);
      expect(transformExecMethodsMap({rest: {driver: {'mobile: shell': {}}}})).toEqual([]);
    });
    it('should transform a basic response', function () {
      const getExecMethodsResponse = {
        rest: {
          driver: {
            'mobile: startLogsBroadcast': {command: 'mobileStartLogsBroadcast'},
            'mobile: performEditorAction': {
              command: 'mobilePerformEditorAction',
              params: [{name: 'action', required: true}],
            },
          },
        },
      };
      expect(transformExecMethodsMap(getExecMethodsResponse)).toEqual([
        ['mobile: startLogsBroadcast', {command: 'mobileStartLogsBroadcast'}],
        [
          'mobile: performEditorAction',
          {
            command: 'mobilePerformEditorAction',
            params: [{name: 'action', required: true}],
          },
        ],
      ]);
    });
    it('should filter out empty method parameters', function () {
      const getExecMethodsResponse = {
        rest: {
          driver: {
            'mobile: startLogsBroadcast': {command: 'mobileStartLogsBroadcast', params: []},
            'mobile: performEditorAction': {
              command: 'mobilePerformEditorAction',
              params: [{}, {name: 'action', required: true}],
            },
          },
        },
      };
      expect(transformExecMethodsMap(getExecMethodsResponse)).toEqual([
        ['mobile: startLogsBroadcast', {command: 'mobileStartLogsBroadcast'}],
        [
          'mobile: performEditorAction',
          {
            command: 'mobilePerformEditorAction',
            params: [{name: 'action', required: true}],
          },
        ],
      ]);
    });
    it('should merge methods from all scopes into one', function () {
      const getExecMethodsResponse = {
        rest: {
          driver: {
            'mobile: startLogsBroadcast': {command: 'mobileStartLogsBroadcast'},
          },
          plugins: {
            plugin1: {
              'mobile: getNotifications': {command: 'mobileGetNotifications'},
            },
            plugin2: {
              'mobile: performEditorAction': {
                command: 'mobilePerformEditorAction',
                params: [{name: 'action', required: true}],
              },
            },
          },
        },
      };
      expect(transformExecMethodsMap(getExecMethodsResponse)).toEqual([
        ['mobile: startLogsBroadcast', {command: 'mobileStartLogsBroadcast'}],
        ['mobile: getNotifications', {command: 'mobileGetNotifications'}],
        [
          'mobile: performEditorAction',
          {
            command: 'mobilePerformEditorAction',
            params: [{name: 'action', required: true}],
          },
        ],
      ]);
    });
    it('should prefer plugin commands over driver commands in case of overrides', function () {
      const getExecMethodsResponse = {
        rest: {
          driver: {
            'mobile: doThing': {command: 'doThing', info: 'from-driver'},
          },
          plugins: {
            somePlugin: {
              'mobile: doThing': {command: 'doThing', info: 'from-plugin'},
            },
          },
        },
      };
      expect(transformExecMethodsMap(getExecMethodsResponse)).toEqual([
        ['mobile: doThing', {command: 'doThing', info: 'from-plugin'}],
      ]);
    });
  });
});
