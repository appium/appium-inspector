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
    const host = (experitest.hostname = experitestUrl.hostname);
    const path = (experitest.path = '/wd/hub');
    const https = (experitest.ssl = experitestUrl.protocol === 'https:');
    const port = (experitest.port =
      experitestUrl.port === '' ? (https ? 443 : 80) : experitestUrl.port);
    return {
      path,
      host,
      port,
      https,
    };
  }
}
