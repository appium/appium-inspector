import _ from 'lodash';

import i18n from '../../i18next';
import { BaseVendor } from './base';

export class LambdatestVendor extends BaseVendor {
  /**
   * @override
   */
  async apply(sessionCaps) {
    const lambdatest = this._server.lambdatest;
    const advanced = this._server.advanced;
    const host = lambdatest.hostname = process.env.LAMBDATEST_HOST || 'mobile-hub.lambdatest.com';
    const port = lambdatest.port = process.env.LAMBDATEST_PORT || 443;
    const path = lambdatest.path = '/wd/hub';
    if (_.has(sessionCaps, 'lt:options')) {
      sessionCaps['lt:options'].source = 'appiumdesktop';
      sessionCaps['lt:options'].isRealMobile = true;
      if (advanced.useProxy) {
        sessionCaps['lt:options'].proxyUrl = _.isUndefined(advanced.proxy)
          ? ''
          : advanced.proxy;
      }
    } else {
      sessionCaps['lambdatest:source'] = 'appiumdesktop';
      sessionCaps['lambdatest:isRealMobile'] = true;
      if (advanced.useProxy) {
        sessionCaps['lambdatest:proxyUrl'] = _.isUndefined(advanced.proxy)
          ? ''
          : advanced.proxy;
      }
    }
    const username = lambdatest.username || process.env.LAMBDATEST_USERNAME;
    const accessKey = lambdatest.accessKey || process.env.LAMBDATEST_ACCESS_KEY;
    if (!username || !accessKey) {
      throw new Error(i18n.t('lambdatestCredentialsRequired'));
    }
    const https = lambdatest.ssl = parseInt(port, 10) === 443;
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
