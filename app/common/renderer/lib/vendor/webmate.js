import {BaseVendor} from './base.js';

export class WebmateVendor extends BaseVendor {
  /**
   * @override
   */
  async configureProperties() {
    const webmate = this._server.webmate;
    const vendorName = 'webmate';

    const emailAddress = webmate.emailAddress || process.env.WEBMATE_EMAIL_ADDRESS;
    const apiKey = webmate.apiKey || process.env.WEBMATE_API_KEY;
    this._checkInputPropertyPresence(vendorName, [
      {name: 'email address', val: emailAddress},
      {name: 'API key', val: apiKey},
    ]);

    const host = webmate.seleniumHost || process.env.WEBMATE_SELENIUM_HOST || 'selenium.webmate.io';
    const path = '/wd/hub';
    const port = 443;
    const https = true;
    this._saveProperties(webmate, {host, path, port, https, emailAddress, apiKey});

    this._updateSessionCap('wm:email', emailAddress);
    this._updateSessionCap('wm:apikey', apiKey);
  }
}
