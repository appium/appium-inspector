import chai from 'chai';

import {addVendorPrefixes} from '../../app/renderer/src/utils/other';

chai.should();

describe('utils/other.js', function () {
  describe('#addVendorPrefixes', function () {
    it('should convert unprefixed non-standard caps to use appium prefix', function () {
      const caps = [{name: 'udid'}, {name: 'deviceName'}];
      addVendorPrefixes(caps).should.eql([{name: 'appium:udid'}, {name: 'appium:deviceName'}]);
    });

    it('should not convert already-prefixed or standard caps', function () {
      const caps = [{name: 'udid'}, {name: 'browserName'}, {name: 'goog:chromeOptions'}];
      addVendorPrefixes(caps).should.eql([
        {name: 'appium:udid'},
        {name: 'browserName'},
        {name: 'goog:chromeOptions'},
      ]);
    });
  });
});
