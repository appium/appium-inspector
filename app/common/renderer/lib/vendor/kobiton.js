import {BaseVendor} from './base.js';

export class KobitonVendor extends BaseVendor {
  /**
   * @override
   */
  async setProperties() {
    const kobiton = this._server.kobiton;
    const vendorName = 'Kobiton';

    const username = kobiton.username || process.env.KOBITON_USERNAME;
    const accessKey = kobiton.accessKey || process.env.KOBITON_ACCESS_KEY;
    this.checkInputPropertyPresence(vendorName, [
      {name: 'Username', val: username},
      {name: 'API Key', val: accessKey},
    ]);

    const host = process.env.KOBITON_HOST || 'api.kobiton.com';
    const port = 443;
    const path = '/wd/hub';
    const https = true;
    this.saveProperties(kobiton, {host, path, port, https, username, accessKey});

    this.updateSessionCap('kobiton:options', {
      source: 'appiumdesktop',
    });
  }
}
