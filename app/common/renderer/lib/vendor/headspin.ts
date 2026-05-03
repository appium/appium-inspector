import {BaseVendor} from './base.js';

export class HeadspinVendor extends BaseVendor {
  override async configureProperties(): Promise<void> {
    const headspin = this._server.headspin;
    const vendorName = 'HeadSpin';

    const url = headspin.webDriverUrl as string | undefined;
    this._checkInputPropertyPresence(vendorName, [{name: 'WebDriver URL', val: url}]);
    const headspinUrl = this._validateUrl(url as string);

    const host = headspinUrl.hostname;
    const path = headspinUrl.pathname;
    const https = headspinUrl.protocol === 'https:';
    const port = headspinUrl.port === '' ? (https ? 443 : 80) : headspinUrl.port;
    this._saveProperties(headspin, {host, path, port, https});
  }
}
