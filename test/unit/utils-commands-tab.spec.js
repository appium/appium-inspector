import {describe, expect, it} from 'vitest';

import {
  deepFilterEmpty,
  extractParamsFromCommandPath,
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
});
