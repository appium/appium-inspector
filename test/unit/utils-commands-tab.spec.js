import {describe, expect, it} from 'vitest';

import {
  deepFilterEmpty,
  extractParamsFromCommandPath,
  transformCommandsMap,
  transformExecMethodsMap,
  transformMethodMap,
} from '../../app/common/renderer/utils/commands-tab.js';

describe('utils/commands-tab.js', function () {
  describe('#transformMethodMap', function () {
    it('should only call toPairs if the search query is empty', function () {
      const methodMap = {method: {command: 'test'}};
      expect(transformMethodMap(methodMap, '')).toEqual([['method', {command: 'test'}]]);
    });
    it('should only return methods that match the search query', function () {
      const methodMap = {
        method1: {command: 'test'},
        method2: {command: 'rest'},
      };
      expect(transformMethodMap(methodMap, 'hod2')).toEqual([['method2', {command: 'rest'}]]);
      expect(transformMethodMap(methodMap, 'method1')).toEqual([['method1', {command: 'test'}]]);
      expect(transformMethodMap(methodMap, 'somethingelse')).toEqual([]);
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
    it('should return empty response if no REST command details are found', function () {
      expect(transformCommandsMap({})).toEqual({});
      expect(transformCommandsMap({notrest: {}})).toEqual({});
      expect(transformCommandsMap({rest: {}})).toEqual({});
      expect(transformCommandsMap({rest: {base: {}}})).toEqual({});
      expect(transformCommandsMap({rest: {base: {'/status': {}}}})).toEqual({});
      expect(transformCommandsMap({rest: {base: {'/status': {GET: {}}}}})).toEqual({});
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
      expect(transformCommandsMap(getCmdsResponse)).toEqual({
        forward: {command: 'forward'},
        pullFile: {command: 'pullFile', params: [{name: 'path', required: true}]},
      });
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
      expect(transformCommandsMap(getCmdsResponse)).toEqual({
        status: {command: 'getStatus'},
        switchToFrame: {command: 'setFrame', params: [{name: 'id', required: true}]},
      });
    });
    it('should filter out commands with missing or unsupported command names', function () {
      const getCmdsResponse = {
        rest: {
          base: {
            '/status': {GET: {notcommand: 'getStatus'}},
            '/session/:sessionId/appium/commands': {GET: {command: 'notListCommands'}},
            '/session/:sessionId/appium/extensions': {GET: {command: 'listExtensions'}},
          },
        },
      };
      expect(transformCommandsMap(getCmdsResponse)).toEqual({
        getAppiumExtensions: {command: 'listExtensions'},
      });
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
      expect(transformCommandsMap(getCmdsResponse)).toEqual({
        status: {command: 'getStatus'},
        pullFile: {command: 'pullFile', params: [{name: 'path', required: true}]},
      });
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
      expect(transformCommandsMap(getCmdsResponse)).toEqual({
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
      });
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
      expect(transformCommandsMap(getCmdsResponse)).toEqual({
        status: {command: 'getStatus'},
        getAppiumCommands: {command: 'listCommands'},
        getAppiumExtensions: {command: 'listExtensions'},
        forward: {command: 'forward'},
      });
    });
  });

  describe('#transformExecMethodsMap', function () {
    it('should return empty response if no REST method details are found', function () {
      expect(transformExecMethodsMap({})).toEqual({});
      expect(transformExecMethodsMap({notrest: {}})).toEqual({});
      expect(transformExecMethodsMap({rest: {}})).toEqual({});
      expect(transformExecMethodsMap({rest: {driver: {}}})).toEqual({});
      expect(transformExecMethodsMap({rest: {driver: {'mobile: shell': {}}}})).toEqual({});
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
      expect(transformExecMethodsMap(getExecMethodsResponse)).toEqual({
        'mobile: startLogsBroadcast': {command: 'mobileStartLogsBroadcast'},
        'mobile: performEditorAction': {
          command: 'mobilePerformEditorAction',
          params: [{name: 'action', required: true}],
        },
      });
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
      expect(transformExecMethodsMap(getExecMethodsResponse)).toEqual({
        'mobile: startLogsBroadcast': {command: 'mobileStartLogsBroadcast'},
        'mobile: performEditorAction': {
          command: 'mobilePerformEditorAction',
          params: [{name: 'action', required: true}],
        },
      });
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
      expect(transformExecMethodsMap(getExecMethodsResponse)).toEqual({
        'mobile: startLogsBroadcast': {command: 'mobileStartLogsBroadcast'},
        'mobile: getNotifications': {command: 'mobileGetNotifications'},
        'mobile: performEditorAction': {
          command: 'mobilePerformEditorAction',
          params: [{name: 'action', required: true}],
        },
      });
    });
  });
});
