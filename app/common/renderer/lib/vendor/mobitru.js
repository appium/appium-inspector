import {BaseVendor} from './base.js';

export class MobitruVendor extends BaseVendor {
  /**
   * @override
   */
  async apply() {
    const mobitru = this._server.mobitru;

    const webDriverUrl =
      mobitru.webDriverUrl || process.env.MOBITRU_WEBDRIVER_URL || 'https://app.mobitru.com/wd/hub';
    const mobitruUrl = this._validateUrl(webDriverUrl);

    const host = mobitruUrl.hostname;
    const path = mobitruUrl.pathname;
    const https = mobitruUrl.protocol === 'https:';
    const port = mobitruUrl.port === '' ? (https ? 443 : 80) : mobitruUrl.port;
    this._setCommonProperties({vendor: mobitru, host, path, port, https});

    const username = mobitru.username || process.env.MOBITRU_BILLING_UNIT || 'personal';
    const accessKey = mobitru.accessKey || process.env.MOBITRU_ACCESS_KEY;
    if (!accessKey) {
      throw new Error(this._translate('mobitruCredentialsRequired'));
    }

    this._updateSessionCap('mobitru:options', {
      source: 'appium-inspector',
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
