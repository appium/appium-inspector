import i18n from '../../i18next';
import { BaseVendor } from './base';

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
      throw new Error(i18n.t('tvlabsCredentialsRequired'));
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
