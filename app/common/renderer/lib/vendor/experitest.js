import {BaseVendor} from './base.js';

export class ExperitestVendor extends BaseVendor {
  /**
   * @override
   */
  async configureProperties() {
    const experitest = this._server.experitest;
    const vendorName = 'Experitest';

    const url = experitest.url;
    const accessKey = experitest.accessKey;
    this._checkInputPropertyPresence(vendorName, [
      {name: 'URL', val: url},
      {name: 'Access Key', val: accessKey},
    ]);
    const experitestUrl = this._validateUrl(url);

    const host = experitestUrl.hostname;
    const path = '/wd/hub';
    const https = experitestUrl.protocol === 'https:';
    const port = experitestUrl.port === '' ? (https ? 443 : 80) : experitestUrl.port;
    this._saveProperties(experitest, {host, path, port, https});

    this._updateSessionCap('experitest:accessKey', accessKey);
  }
}
