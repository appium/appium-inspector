import {BaseVendor} from './base.js';

export class TestcribeVendor extends BaseVendor {
  override async configureProperties(): Promise<void> {
    const testcribe = this._server.testcribe;
    const vendorName = 'Testcribe';

    const apiKey =
      (testcribe.apiKey as string | undefined) ||
      (process.env.TESTCRIBE_API_KEY as string | undefined);
    this._checkInputPropertyPresence(vendorName, [{name: 'API Key', val: apiKey}]);
    const apiKeyDefined = apiKey as string;

    const host = process.env.TESTCRIBE_WEBDRIVER_URL || 'app.testcribe.com';
    const port = 443;
    const https = true;
    const path = '/gw';
    this._saveProperties(testcribe, {
      host,
      path,
      port,
      https,
      accessKey: apiKeyDefined,
    });
    this._updateSessionCap('testcribe:options', {apikey: apiKeyDefined});
    this._updateSessionCap('appium:apiKey', apiKeyDefined);
  }
}
