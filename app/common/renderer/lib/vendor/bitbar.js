import {BaseVendor} from './base.js';

export class BitbarVendor extends BaseVendor {
  /**
   * @override
   */
  async configureProperties() {
    const bitbar = this._server.bitbar;
    const vendorName = 'BitBar';

    const apiKey = bitbar.apiKey || process.env.BITBAR_API_KEY;
    this._checkInputPropertyPresence(vendorName, [{name: 'API Key', val: apiKey}]);

    const host = process.env.BITBAR_HOST || 'appium.bitbar.com';
    const port = 443;
    const path = '/wd/hub';
    const https = true;
    this._saveProperties(bitbar, {host, path, port, https, accessKey: apiKey});

    this._updateSessionCap(
      'bitbar:options',
      {
        source: 'appiumdesktop',
        apiKey,
      },
      false,
    );
  }
}
