import {BaseVendor} from './base.js';

export class TvlabsVendor extends BaseVendor {
  /**
   * @override
   */
  async apply() {
    const tvlabs = this._server.tvlabs;
    const vendorName = 'TV Labs';

    const accessKey = tvlabs.apiKey || process.env.TVLABS_API_KEY;
    this._checkInputPropertyPresence(vendorName, [{name: 'API Key', val: accessKey}]);
    const headers = {Authorization: `Bearer ${accessKey}`};

    const host = process.env.TVLABS_WEBDRIVER_URL || 'appium.tvlabs.ai';
    const path = '/';
    const port = 4723;
    const https = host === 'appium.tvlabs.ai';
    this._setProperties(tvlabs, {host, path, port, https, accessKey, headers});

    return {
      path,
      host,
      port,
      headers,
      accessKey,
      https,
    };
  }
}
