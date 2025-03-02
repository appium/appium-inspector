import {BaseVendor} from './base.js';

export class PcloudyVendor extends BaseVendor {
  /**
   * @override
   */
  async apply(sessionCaps) {
    const pcloudy = this._server.pcloudy;
    const host = pcloudy.hostname;
    const port = (pcloudy.port = 443);
    const path = (pcloudy.path = '/objectspy/wd/hub');
    const username = pcloudy.username || process.env.PCLOUDY_USERNAME;
    const accessKey = pcloudy.accessKey || process.env.PCLOUDY_ACCESS_KEY;
    if (!username || !accessKey) {
      throw new Error(this._translate('pcloudyCredentialsRequired'));
    }
    sessionCaps['pcloudy:options'] = {
      ...(sessionCaps['pcloudy:options'] ?? {}),
      source: 'appiumdesktop',
      pCloudy_Username: username,
      pCloudy_ApiKey: accessKey,
    };
    const https = (pcloudy.ssl = true);
    return {
      path,
      host,
      port,
      username,
      accessKey,
      https,
    };
  }
}
