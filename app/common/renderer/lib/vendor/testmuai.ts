import {BaseVendor} from './base.js';

export class TestMuAIVendor extends BaseVendor {
  override async configureProperties(): Promise<void> {
    const testmuai = this._server.lambdatest;
    const advanced = this._server.advanced;
    const vendorName = 'TestMu AI';

    const username =
      (testmuai.username as string | undefined) ||
      (process.env.LAMBDATEST_USERNAME as string | undefined);
    const accessKey =
      (testmuai.accessKey as string | undefined) ||
      (process.env.LAMBDATEST_ACCESS_KEY as string | undefined);
    this._checkInputPropertyPresence(vendorName, [
      {name: 'Username', val: username},
      {name: 'Access Key', val: accessKey},
    ]);

    const host = process.env.LAMBDATEST_HOST || 'mobile-hub.lambdatest.com';
    const port = process.env.LAMBDATEST_PORT || 443;
    const path = '/wd/hub';
    const https = parseInt(String(port), 10) === 443;
    this._saveProperties(testmuai, {host, path, port, https, username, accessKey});

    if (Object.hasOwn(this._sessionCaps, 'lt:options')) {
      const options: Record<string, unknown> = {
        source: 'appiumdesktop',
        isRealMobile: true,
      };
      if (advanced?.useProxy) {
        options.proxyUrl = advanced?.proxy === undefined ? '' : advanced.proxy;
      }
      this._updateSessionCap('lt:options', options);
    } else {
      this._updateSessionCap('lambdatest:source', 'appiumdesktop');
      this._updateSessionCap('lambdatest:isRealMobile', true);
      if (advanced?.useProxy) {
        this._updateSessionCap(
          'lambdatest:proxyUrl',
          advanced?.proxy === undefined ? '' : advanced.proxy,
        );
      }
    }
  }
}
