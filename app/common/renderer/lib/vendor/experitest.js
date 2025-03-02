import {BaseVendor} from './base.js';

export class ExperitestVendor extends BaseVendor {
  /**
   * @override
   */
  async apply(sessionCaps) {
    const experitest = this._server.experitest;
    if (!experitest.url || !experitest.accessKey) {
      throw new Error(this._translate('experitestAccessKeyURLRequired'));
    }
    sessionCaps['experitest:accessKey'] = experitest.accessKey;

    let experitestUrl;
    try {
      experitestUrl = new URL(experitest.url);
    } catch {
      throw new Error(`${this._translate('Invalid URL:')} ${experitest.url}`);
    }

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
