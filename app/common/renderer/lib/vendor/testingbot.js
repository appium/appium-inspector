import {BaseVendor} from './base.js';

export class TestingbotVendor extends BaseVendor {
  /**
   * @override
   */
  async apply(sessionCaps) {
    const testingbot = this._server.testingbot;
    const host = (testingbot.hostname = process.env.TB_HOST || 'hub.testingbot.com');
    const port = (testingbot.port = 443);
    const path = (testingbot.path = '/wd/hub');
    const username = testingbot.username || process.env.TB_KEY;
    const accessKey = testingbot.accessKey || process.env.TB_SECRET;
    if (!username || !accessKey) {
      throw new Error(this._translate('testingbotCredentialsRequired'));
    }
    sessionCaps['tb:options'] = {
      ...(sessionCaps['tb:options'] ?? {}),
      key: username,
      secret: accessKey,
      source: 'appiumdesktop',
    };
    const https = (testingbot.ssl = true);
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
