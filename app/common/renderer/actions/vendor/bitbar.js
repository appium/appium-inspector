import i18n from '../../i18next';
import { BaseVendor } from './base';

export class BitbarVendor extends BaseVendor {
  /**
   * @override
   */
  async apply(sessionCaps) {
    const bitbar = this._server.bitbar;
    const host = process.env.BITBAR_HOST || 'appium.bitbar.com';
    const port = bitbar.port = 443;
    const path = bitbar.path = '/wd/hub';
    const accessKey = bitbar.apiKey || process.env.BITBAR_API_KEY;
    if (!accessKey) {
      throw new Error(i18n.t('bitbarCredentialsRequired'));
    }
    sessionCaps['bitbar:options'] = {
      ...(sessionCaps['bitbar:options'] ?? {}),
      source: 'appiumdesktop',
      apiKey: accessKey,
    };
    const https = bitbar.ssl = true;
    return {
      path,
      host,
      port,
      accessKey,
      https,
    };
  }
}
