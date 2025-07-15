import {describe, expect, it} from 'vitest';

import {addVendorPrefixes} from '../../app/common/renderer/utils/other';

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
  });
});
