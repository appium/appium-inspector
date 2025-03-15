import {BaseVendor} from './base.js';

export class TvlabsVendor extends BaseVendor {
  /**
   * @override
   */
  async setProperties() {
    const tvlabs = this._server.tvlabs;
    const vendorName = 'TV Labs';

    const accessKey = tvlabs.apiKey || process.env.TVLABS_API_KEY;
    this._checkInputPropertyPresence(vendorName, [{name: 'API Key', val: accessKey}]);
    const headers = {Authorization: `Bearer ${accessKey}`};

    const host = process.env.TVLABS_WEBDRIVER_URL || 'appium.tvlabs.ai';
    const path = '/';
    const port = 4723;
    const https = host === 'appium.tvlabs.ai';
    this._saveProperties(tvlabs, {host, path, port, https, accessKey, headers});
  }
}
