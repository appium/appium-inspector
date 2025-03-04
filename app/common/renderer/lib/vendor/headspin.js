import {BaseVendor} from './base.js';

export class HeadspinVendor extends BaseVendor {
  /**
   * @override
   */
  async apply() {
    const headspin = this._server.headspin;
    const headspinUrl = this._validateUrl(headspin.webDriverUrl);
    const host = (headspin.hostname = headspinUrl.hostname);
    const path = (headspin.path = headspinUrl.pathname);
    const https = (headspin.ssl = headspinUrl.protocol === 'https:');
    // new URL() does not have the port of 443 when `https` and 80 when `http`
    const port = (headspin.port = headspinUrl.port === '' ? (https ? 443 : 80) : headspinUrl.port);
    return {
      path,
      host,
      port,
      https,
    };
  }
}
