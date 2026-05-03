import {BaseVendor} from './base.js';

export class KobitonVendor extends BaseVendor {
  override async configureProperties(): Promise<void> {
    const kobiton = this._server.kobiton;
    const vendorName = 'Kobiton';

    const username =
      (kobiton.username as string | undefined) ||
      (process.env.KOBITON_USERNAME as string | undefined);
    const accessKey =
      (kobiton.accessKey as string | undefined) ||
      (process.env.KOBITON_ACCESS_KEY as string | undefined);
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
