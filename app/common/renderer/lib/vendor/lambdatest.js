import _ from 'lodash';

import {BaseVendor} from './base.js';

export class LambdatestVendor extends BaseVendor {
  /**
   * @override
   */
  async apply() {
    const lambdatest = this._server.lambdatest;
    const advanced = this._server.advanced;
    const host = (lambdatest.hostname = process.env.LAMBDATEST_HOST || 'mobile-hub.lambdatest.com');
    const port = (lambdatest.port = process.env.LAMBDATEST_PORT || 443);
    const path = (lambdatest.path = '/wd/hub');
    const username = lambdatest.username || process.env.LAMBDATEST_USERNAME;
    const accessKey = lambdatest.accessKey || process.env.LAMBDATEST_ACCESS_KEY;
    if (!username || !accessKey) {
      throw new Error(this._translate('lambdatestCredentialsRequired'));
    }
    if (_.has(this._sessionCaps, 'lt:options')) {
      const options = {
        source: 'appiumdesktop',
        isRealMobile: true,
      };
      if (advanced.useProxy) {
        options.proxyUrl = _.isUndefined(advanced.proxy) ? '' : advanced.proxy;
      }
      this._updateSessionCap('lt:options', options);
    } else {
      this._updateSessionCap('lambdatest:source', 'appiumdesktop');
      this._updateSessionCap('lambdatest:isRealMobile', true);
      if (advanced.useProxy) {
        this._updateSessionCap(
          'lambdatest:proxyUrl',
          _.isUndefined(advanced.proxy) ? '' : advanced.proxy,
        );
      }
    }
    const https = (lambdatest.ssl = parseInt(port, 10) === 443);
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
