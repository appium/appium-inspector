import {BaseVendor} from './base.js';

export class TestingbotVendor extends BaseVendor {
  /**
   * @override
   */
  async apply() {
    const testingbot = this._server.testingbot;

    const host = process.env.TB_HOST || 'hub.testingbot.com';
    const port = 443;
    const path = '/wd/hub';
    const https = true;
    this._setCommonProperties({vendor: testingbot, host, path, port, https});

    const username = testingbot.username || process.env.TB_KEY;
    const accessKey = testingbot.accessKey || process.env.TB_SECRET;
    if (!username || !accessKey) {
      throw new Error(this._translate('testingbotCredentialsRequired'));
    }
    this._updateSessionCap('tb:options', {
      key: username,
      secret: accessKey,
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
