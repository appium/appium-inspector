import {BaseVendor} from './base.js';

export class KobitonVendor extends BaseVendor {
  /**
   * @override
   */
  async configureProperties() {
    const kobiton = this._server.kobiton;
    const vendorName = 'Kobiton';

    const username = kobiton.username || process.env.KOBITON_USERNAME;
    const accessKey = kobiton.accessKey || process.env.KOBITON_ACCESS_KEY;
    this._checkInputPropertyPresence(vendorName, [
      {name: 'Username', val: username},
      {name: 'API Key', val: accessKey},
    ]);

    const host = process.env.KOBITON_HOST || 'api.kobiton.com';
    const port = 443;
    const path = '/wd/hub';
    const https = true;
    this._saveProperties(kobiton, {host, path, port, https, username, accessKey});

    this._updateSessionCap('kobiton:options', {
      source: 'appiumdesktop',
    });
  }
}
