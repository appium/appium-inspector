import {BaseVendor} from './base.js';

export class TestcribeVendor extends BaseVendor {
  /**
   * @override
   */
  async configureProperties() {
    const testcribe = this._server.testcribe;
    const vendorName = 'Testcribe';

    const apiKey = testcribe.apiKey || process.env.TESTCRIBE_API_KEY;
    this._checkInputPropertyPresence(vendorName, [{name: 'API Key', val: apiKey}]);

    const host = process.env.TESTCRIBE_WEBDRIVER_URL || 'app.testcribe.com';
    const port = 443;
    const https = true;
    const path = '/gw';
    this._saveProperties(testcribe, {host, path, port, https, accessKey: apiKey});

    this._updateSessionCap('testcribe:options', {apikey: apiKey});
    this._updateSessionCap('appium:apiKey', apiKey);
  }
}
