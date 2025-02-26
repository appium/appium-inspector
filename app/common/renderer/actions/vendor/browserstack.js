import i18n from '../../i18next';
import {BaseVendor} from './base';

export class BrowserstackVendor extends BaseVendor {
  /**
   * @override
   */
  async apply(sessionCaps) {
    const browserstack = this._server.browserstack;
    const host = (browserstack.hostname =
      process.env.BROWSERSTACK_HOST || 'hub-cloud.browserstack.com');
    const port = (browserstack.port = process.env.BROWSERSTACK_PORT || 443);
    const path = (browserstack.path = '/wd/hub');
    const username = browserstack.username || process.env.BROWSERSTACK_USERNAME;
    sessionCaps['bstack:options'] = {
      ...(sessionCaps['bstack:options'] ?? {}),
      source: 'appiumdesktop',
    };
    const accessKey = browserstack.accessKey || process.env.BROWSERSTACK_ACCESS_KEY;
    if (!username || !accessKey) {
      throw new Error(i18n.t('browserstackCredentialsRequired'));
    }
    const https = (browserstack.ssl = parseInt(port, 10) === 443);
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
