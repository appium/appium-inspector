import {BaseVendor} from './base.js';

export class MobitruVendor extends BaseVendor {
  /**
   * @override
   */
  async configureProperties() {
    const mobitru = this._server.mobitru;
    const vendorName = 'Mobitru';

    const username = mobitru.username || process.env.MOBITRU_BILLING_UNIT || 'personal';
    const accessKey = mobitru.accessKey || process.env.MOBITRU_ACCESS_KEY;
    const url =
      mobitru.webDriverUrl || process.env.MOBITRU_WEBDRIVER_URL || 'https://app.mobitru.com/wd/hub';
    this._checkInputPropertyPresence(vendorName, [{name: 'Access Key', val: accessKey}]);
    const mobitruUrl = this._validateUrl(url);

    const host = mobitruUrl.hostname;
    const path = mobitruUrl.pathname;
    const https = mobitruUrl.protocol === 'https:';
    const port = mobitruUrl.port === '' ? (https ? 443 : 80) : mobitruUrl.port;
    this._saveProperties(mobitru, {host, path, port, https, username, accessKey});

    this._updateSessionCap('mobitru:options', {
      source: 'appium-inspector',
    });
  }
}
