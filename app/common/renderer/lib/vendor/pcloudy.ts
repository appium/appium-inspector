import {BaseVendor} from './base.js';

export class PcloudyVendor extends BaseVendor {
  override async configureProperties(): Promise<void> {
    const pcloudy = this._server.pcloudy;
    const vendorName = 'pCloudy';

    const host = pcloudy.hostname as string | undefined;
    const username =
      (pcloudy.username as string | undefined) ||
      (process.env.PCLOUDY_USERNAME as string | undefined);
    const accessKey =
      (pcloudy.accessKey as string | undefined) ||
      (process.env.PCLOUDY_ACCESS_KEY as string | undefined);
    this._checkInputPropertyPresence(vendorName, [
      {name: 'Host', val: host},
      {name: 'Username', val: username},
      {name: 'API Key', val: accessKey},
    ]);

    const port = 443;
    const path = '/objectspy/wd/hub';
    const https = true;
    this._saveProperties(pcloudy, {
      host: host as string,
      path,
      port,
      https,
      username,
      accessKey,
    });

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
