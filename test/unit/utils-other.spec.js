import {describe, expect, it} from 'vitest';

import {addVendorPrefixes} from '../../app/common/renderer/utils/other.js';

describe('utils/other.js', function () {
  describe('#addVendorPrefixes', function () {
    it('should convert unprefixed non-standard caps to use appium prefix', function () {
      const caps = [{name: 'udid'}, {name: 'deviceName'}];
      expect(addVendorPrefixes(caps)).toEqual([{name: 'appium:udid'}, {name: 'appium:deviceName'}]);
    });

    it('should not convert already-prefixed or standard caps', function () {
      const caps = [{name: 'udid'}, {name: 'browserName'}, {name: 'goog:chromeOptions'}];
      expect(addVendorPrefixes(caps)).toEqual([
        {name: 'appium:udid'},
        {name: 'browserName'},
        {name: 'goog:chromeOptions'},
      ]);
    });

    it('should not mutate frozen capability objects from Redux state', function () {
      const caps = Object.freeze([
        Object.freeze({name: 'udid', value: '1234', enabled: true, type: 'text'}),
        Object.freeze({name: 'platformName', value: 'Android', enabled: true, type: 'text'}),
      ]);
      const result = addVendorPrefixes(caps);
      expect(result).toEqual([
        {name: 'appium:udid', value: '1234', enabled: true, type: 'text'},
        {name: 'platformName', value: 'Android', enabled: true, type: 'text'},
      ]);
      expect(caps[0].name).toBe('udid');
    });
  });
});
