import {BaseVendor} from './base.js';

export class WebmateVendor extends BaseVendor {
  /**
   * @override
   */
  async configureProperties() {
    const webmate = this._server.webmate;
    const vendorName = 'webmate';

    const apiKey = webmate.apiKey || process.env.WEBMATE_APIKEY;
    const projectId = webmate.projectId || process.env.WEBMATE_PROJECT;
    this._checkInputPropertyPresence(vendorName, [{name: 'API key', val: apiKey}]);

    const host =
      (webmate.useCustomHost && webmate.seleniumHost) ||
      process.env.WEBMATE_HOST ||
      'selenium.webmate.io';
    const path = '/wd/hub';
    const port = 443;
    const https = true;
    this._saveProperties(webmate, {host, path, port, https, accessKey: apiKey});

    this._updateSessionCap('wm:apikey', apiKey);
    if (projectId) {
      this._updateSessionCap('wm:project', projectId);
    }
  }
}
