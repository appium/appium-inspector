import {BaseVendor} from './base.js';

export class TvlabsVendor extends BaseVendor {
  /**
   * @override
   */
  async apply(/* sessionCaps **/) {
    const tvlabs = this._server.tvlabs;
    const host = process.env.TVLABS_WEBDRIVER_URL || 'appium.tvlabs.ai';
    const path = '/';
    const port = 4723;
    const https = host === 'appium.tvlabs.ai';
    const accessKey = tvlabs.apiKey || process.env.TVLABS_API_KEY;
    if (!accessKey) {
      throw new Error(this._translate('tvlabsCredentialsRequired'));
    }
    const headers = {Authorization: `Bearer ${accessKey}`};
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
