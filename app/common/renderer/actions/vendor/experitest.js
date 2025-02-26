import i18n from '../../i18next';
import { BaseVendor } from './base';

export class ExperitestVendor extends BaseVendor {
  /**
   * @override
   */
  async apply(sessionCaps) {
    const experitest = this._server.experitest;
    if (!experitest.url || !experitest.accessKey) {
      throw new Error(i18n.t('experitestAccessKeyURLRequired'));
    }
    sessionCaps['experitest:accessKey'] = experitest.accessKey;

    let experitestUrl;
    try {
      experitestUrl = new URL(experitest.url);
    } catch {
      throw new Error(`${i18n.t('Invalid URL:')} ${experitest.url}`);
    }

    const host = experitest.hostname = experitestUrl.hostname;
    const path = experitest.path = '/wd/hub';
    const https = experitest.ssl = experitestUrl.protocol === 'https:';
    const port = experitest.port = experitestUrl.port === ''
      ? (https ? 443 : 80)
      : experitestUrl.port;
    return {
      path,
      host,
      port,
      https,
    };
  }
}
