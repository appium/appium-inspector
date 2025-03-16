import {BaseVendor} from './base.js';

export class BrowserstackVendor extends BaseVendor {
  /**
   * @override
   */
  async configureProperties() {
    const browserstack = this._server.browserstack;
    const vendorName = 'BrowserStack';

    const username = browserstack.username || process.env.BROWSERSTACK_USERNAME;
    const accessKey = browserstack.accessKey || process.env.BROWSERSTACK_ACCESS_KEY;
    this._checkInputPropertyPresence(vendorName, [
      {name: 'Username', val: username},
      {name: 'Access Key', val: accessKey},
    ]);

    const host = process.env.BROWSERSTACK_HOST || 'hub-cloud.browserstack.com';
    const port = process.env.BROWSERSTACK_PORT || 443;
    const path = '/wd/hub';
    const https = parseInt(port, 10) === 443;
    this._saveProperties(browserstack, {host, path, port, https, username, accessKey});

    this._updateSessionCap('bstack:options', {
      source: 'appiumdesktop',
    });
  }
}
