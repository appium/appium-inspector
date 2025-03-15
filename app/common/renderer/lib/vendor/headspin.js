import {BaseVendor} from './base.js';

export class HeadspinVendor extends BaseVendor {
  /**
   * @override
   */
  async setProperties() {
    const headspin = this._server.headspin;
    const vendorName = 'HeadSpin';

    const url = headspin.webDriverUrl;
    this.checkInputPropertyPresence(vendorName, [{name: 'WebDriver URL', val: url}]);
    const headspinUrl = this.validateUrl(headspin.webDriverUrl);

    const host = headspinUrl.hostname;
    const path = headspinUrl.pathname;
    const https = headspinUrl.protocol === 'https:';
    // new URL() does not have the port of 443 when `https` and 80 when `http`
    const port = headspinUrl.port === '' ? (https ? 443 : 80) : headspinUrl.port;
    this.saveProperties(headspin, {host, path, port, https});
  }
}
