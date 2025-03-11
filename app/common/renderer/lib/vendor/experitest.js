import {BaseVendor} from './base.js';

export class ExperitestVendor extends BaseVendor {
  /**
   * @override
   */
  async apply() {
    const experitest = this._server.experitest;
    if (!experitest.url || !experitest.accessKey) {
      throw new Error(this._translate('experitestAccessKeyURLRequired'));
    }
    this._updateSessionCap('experitest:accessKey', experitest.accessKey);
    const experitestUrl = this._validateUrl(experitest.url);

    const host = experitestUrl.hostname;
    const path = '/wd/hub';
    const https = experitestUrl.protocol === 'https:';
    const port = experitestUrl.port === '' ? (https ? 443 : 80) : experitestUrl.port;
    this._setCommonProperties({vendor: experitest, host, path, port, https});

    return {
      path,
      host,
      port,
      https,
    };
  }
}
