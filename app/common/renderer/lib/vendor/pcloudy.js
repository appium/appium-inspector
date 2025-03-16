import {BaseVendor} from './base.js';

export class PcloudyVendor extends BaseVendor {
  /**
   * @override
   */
  async configureProperties() {
    const pcloudy = this._server.pcloudy;
    const vendorName = 'pCloudy';

    const host = pcloudy.hostname;
    const username = pcloudy.username || process.env.PCLOUDY_USERNAME;
    const accessKey = pcloudy.accessKey || process.env.PCLOUDY_ACCESS_KEY;
    this._checkInputPropertyPresence(vendorName, [
      {name: 'Host', val: host},
      {name: 'Username', val: username},
      {name: 'API Key', val: accessKey},
    ]);

    const port = 443;
    const path = '/objectspy/wd/hub';
    const https = true;
    this._saveProperties(pcloudy, {host, path, port, https, username, accessKey});

    this._updateSessionCap(
      'pcloudy:options',
      {
        source: 'appiumdesktop',
        pCloudy_Username: username,
        pCloudy_ApiKey: accessKey,
      },
      false,
    );
  }
}
