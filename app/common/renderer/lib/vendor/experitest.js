import {BaseVendor} from './base.js';

export class ExperitestVendor extends BaseVendor {
  /**
   * @override
   */
  async setProperties() {
    const experitest = this._server.experitest;
    const vendorName = 'Experitest';

    const url = experitest.url;
    const accessKey = experitest.accessKey;
    this.checkInputPropertyPresence(vendorName, [
      {name: 'URL', val: url},
      {name: 'Access Key', val: accessKey},
    ]);
    const experitestUrl = this.validateUrl(url);

    const host = experitestUrl.hostname;
    const path = '/wd/hub';
    const https = experitestUrl.protocol === 'https:';
    const port = experitestUrl.port === '' ? (https ? 443 : 80) : experitestUrl.port;
    this.saveProperties(experitest, {host, path, port, https});

    this.updateSessionCap('experitest:accessKey', accessKey);
  }
}
