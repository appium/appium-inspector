import {BaseVendor} from './base.js';

export class TestingbotVendor extends BaseVendor {
  override async configureProperties(): Promise<void> {
    const testingbot = this._server.testingbot;
    const vendorName = 'TestingBot';

    const key =
      (testingbot.username as string | undefined) || (process.env.TB_KEY as string | undefined);
    const secret =
      (testingbot.accessKey as string | undefined) || (process.env.TB_SECRET as string | undefined);
    this._checkInputPropertyPresence(vendorName, [
      {name: 'Key', val: key},
      {name: 'Secret', val: secret},
    ]);

    const host = process.env.TB_HOST || 'hub.testingbot.com';
    const port = 443;
    const path = '/wd/hub';
    const https = true;
    this._saveProperties(testingbot, {host, path, port, https, username: key, accessKey: secret});

    this._updateSessionCap('tb:options', {
      key,
      secret,
      source: 'appiumdesktop',
    });
  }
}
