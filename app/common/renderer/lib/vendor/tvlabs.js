import {BaseVendor} from './base.js';

export class TvlabsVendor extends BaseVendor {
  /**
   * @override
   */
  async configureProperties() {
    const tvlabs = this._server.tvlabs;
    const vendorName = 'TV Labs';

    const apiKey = tvlabs.apiKey || process.env.TVLABS_API_KEY;
    this._checkInputPropertyPresence(vendorName, [{name: 'API Key', val: apiKey}]);
    const headers = {Authorization: `Bearer ${apiKey}`};

    const host = process.env.TVLABS_WEBDRIVER_URL || 'appium.tvlabs.ai';
    const path = '/';
    const port = 4723;
    const https = host === 'appium.tvlabs.ai';
    this._saveProperties(tvlabs, {host, path, port, https, accessKey: apiKey, headers});
  }
}
