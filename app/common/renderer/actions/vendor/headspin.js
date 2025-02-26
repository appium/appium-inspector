import i18n from '../../i18next';
import {BaseVendor} from './base';

export class HeadspinVendor extends BaseVendor {
  /**
   * @override
   */
  async apply(/* sessionCaps **/) {
    const headspin = this._server.headspin;
    let headspinUrl;
    try {
      headspinUrl = new URL(headspin.webDriverUrl);
    } catch {
      throw new Error(`${i18n.t('Invalid URL:')} ${headspin.webDriverUrl}`);
    }
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
