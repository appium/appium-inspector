import {BaseVendor} from './base.js';

export class BrowserstackVendor extends BaseVendor {
  /**
   * @override
   */
  async apply() {
    const browserstack = this._server.browserstack;

    const host = process.env.BROWSERSTACK_HOST || 'hub-cloud.browserstack.com';
    const port = process.env.BROWSERSTACK_PORT || 443;
    const path = '/wd/hub';
    const https = parseInt(port, 10) === 443;
    this._setCommonProperties({vendor: browserstack, host, path, port, https});

    const username = browserstack.username || process.env.BROWSERSTACK_USERNAME;
    const accessKey = browserstack.accessKey || process.env.BROWSERSTACK_ACCESS_KEY;
    if (!username || !accessKey) {
      throw new Error(this._translate('browserstackCredentialsRequired'));
    }
    this._updateSessionCap('bstack:options', {
      source: 'appiumdesktop',
    });
    return {
      path,
      host,
      port,
      username,
      accessKey,
      https,
    };
  }
}
