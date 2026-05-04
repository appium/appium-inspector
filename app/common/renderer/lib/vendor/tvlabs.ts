import {BaseVendor} from './base.js';

export class TvlabsVendor extends BaseVendor {
  override async configureProperties(): Promise<void> {
    const tvlabs = this._server.tvlabs;
    const vendorName = 'TV Labs';

    const apiKey =
      (tvlabs.apiKey as string | undefined) || (process.env.TVLABS_API_KEY as string | undefined);
    this._checkInputPropertyPresence(vendorName, [{name: 'API Key', val: apiKey}]);
    const apiKeyDefined = apiKey as string;
    const headers = {Authorization: `Bearer ${apiKeyDefined}`};

    const host =
      process.env.TVLABS_WEBDRIVER_URL || (tvlabs.host as string | undefined) || 'appium.tvlabs.ai';
    const path = (tvlabs.path as string | undefined) || '/';
    const port = (tvlabs.port as number | string | undefined) || 4723;
    const https = Boolean(tvlabs.ssl) || host === 'appium.tvlabs.ai';
    this._saveProperties(tvlabs, {host, path, port, https, accessKey: apiKeyDefined, headers});
  }
}
