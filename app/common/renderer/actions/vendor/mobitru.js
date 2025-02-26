import i18n from '../../i18next';
import { BaseVendor } from './base';

export class MobitruVendor extends BaseVendor {
  /**
   * @override
   */
  async apply(sessionCaps) {
    const mobitru = this._server.mobitru;
    const webDriverUrl = mobitru.webDriverUrl || process.env.MOBITRU_WEBDRIVER_URL || 'https://app.mobitru.com/wd/hub';
    let mobitruUrl;
    try {
      mobitruUrl = new URL(webDriverUrl);
    } catch {
      throw new Error(`${i18n.t('Invalid URL:')} ${webDriverUrl}`);
    }
    const host = mobitru.hostname = mobitruUrl.hostname;
    const path = mobitru.path = mobitruUrl.pathname;
    const https = mobitru.ssl = mobitruUrl.protocol === 'https:';
    const port = mobitru.port = mobitruUrl.port === '' ? (https ? 443 : 80) : mobitruUrl.port;

    const username = mobitru.username || process.env.MOBITRU_BILLING_UNIT || 'personal';
    const accessKey = mobitru.accessKey || process.env.MOBITRU_ACCESS_KEY;
    if (!accessKey) {
      throw new Error(i18n.t('mobitruCredentialsRequired'));
    }

    sessionCaps['mobitru:options'] = {
      ...(sessionCaps['mobitru:options'] ?? {}),
      source: 'appium-inspector',
    };
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
