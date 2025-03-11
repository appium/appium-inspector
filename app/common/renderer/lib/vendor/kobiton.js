import {BaseVendor} from './base.js';

export class KobitonVendor extends BaseVendor {
  /**
   * @override
   */
  async apply() {
    const kobiton = this._server.kobiton;

    const host = process.env.KOBITON_HOST || 'api.kobiton.com';
    const port = 443;
    const path = '/wd/hub';
    const https = true;
    this._setCommonProperties({vendor: kobiton, host, path, port, https});

    const username = kobiton.username || process.env.KOBITON_USERNAME;
    const accessKey = kobiton.accessKey || process.env.KOBITON_ACCESS_KEY;
    if (!username || !accessKey) {
      throw new Error(this._translate('kobitonCredentialsRequired'));
    }
    this._updateSessionCap('kobiton:options', {
      source: 'appiumdesktop',
    });
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
