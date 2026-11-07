import {describe, expect, it, vi} from 'vitest';

import {SaucelabsVendor} from '../../app/common/renderer/lib/vendor/saucelabs.js';

// Stub the i18n wrapper so the vendor can be imported without the electron/polyfills chain
vi.mock('../../app/common/renderer/i18next.js', () => ({default: {t: (key) => key}}));

function apply(sauce) {
  return new SaucelabsVendor({sauce: {username: 'user', accessKey: 'key', ...sauce}}, {}).apply();
}

describe('SaucelabsVendor', function () {
  it('should send credentials to the HTTPS ondemand endpoint, never plaintext', async function () {
    expect(await apply({dataCenter: 'asia-south-2'})).toMatchObject({
      host: 'ondemand.asia-south-2.saucelabs.com',
      port: 443,
      https: true,
      path: '/wd/hub',
    });
  });

  it('should reach the Sauce Connect proxy over HTTP by default', async function () {
    expect(await apply({useSCProxy: true, scHost: 'localhost', scPort: '4445'})).toMatchObject({
      host: 'localhost',
      port: 4445,
      https: false,
    });
  });

  it('should reach the Sauce Connect proxy over HTTPS when SSL is enabled for it', async function () {
    expect(await apply({useSCProxy: true, scHost: 'sc-proxy.example', scPort: 4446, scSsl: true})).toMatchObject({
      host: 'sc-proxy.example',
      port: 4446,
      https: true,
    });
  });
});
