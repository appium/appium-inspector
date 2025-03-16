import _ from 'lodash';

import {BaseVendor} from './base.js';

export class LambdatestVendor extends BaseVendor {
  /**
   * @override
   */
  async configureProperties() {
    const lambdatest = this._server.lambdatest;
    const advanced = this._server.advanced;
    const vendorName = 'LambdaTest';

    const username = lambdatest.username || process.env.LAMBDATEST_USERNAME;
    const accessKey = lambdatest.accessKey || process.env.LAMBDATEST_ACCESS_KEY;
    this._checkInputPropertyPresence(vendorName, [
      {name: 'Username', val: username},
      {name: 'Access Key', val: accessKey},
    ]);

    const host = process.env.LAMBDATEST_HOST || 'mobile-hub.lambdatest.com';
    const port = process.env.LAMBDATEST_PORT || 443;
    const path = '/wd/hub';
    const https = parseInt(port, 10) === 443;
    this._saveProperties(lambdatest, {host, path, port, https, username, accessKey});

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
  }
}
