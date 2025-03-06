import {BaseVendor} from './base.js';

export class TestcribeVendor extends BaseVendor {
  /**
   * @override
   */
  async apply() {
    const testcribe = this._server.testcribe;
    const host = process.env.TESTCRIBE_WEBDRIVER_URL || 'app.testcribe.com';
    const port = 443;
    const https = true;
    const path = '/gw';
    const accessKey = testcribe.apiKey || process.env.TESTCRIBE_API_KEY;
    if (!accessKey) {
      throw new Error(this._translate('testcribeCredentialsRequired'));
    }
    this._updateSessionCap('testcribe:options', {apikey: accessKey});
    this._updateSessionCap('appium:apiKey', accessKey);
    return {
      path,
      host,
      port,
      accessKey,
      https,
    };
  }
}
