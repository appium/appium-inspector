import {BaseVendor} from './base.js';

export class AstrofarmVendor extends BaseVendor {
  override async configureProperties(): Promise<void> {
    const astrofarm = this._server.astrofarm;
    const vendorName = 'Astrofarm';

    const url = astrofarm.webDriverUrl as string | undefined;
    this._checkInputPropertyPresence(vendorName, [{name: 'WebDriver URL', val: url}]);
    const astrofarmUrl = this._validateUrl(url as string);

    const host = astrofarmUrl.hostname;
    const path = astrofarmUrl.pathname;
    const https = astrofarmUrl.protocol === 'https:';
    const port = astrofarmUrl.port === '' ? (https ? 443 : 80) : astrofarmUrl.port;
    this._saveProperties(astrofarm, {host, path, port, https});

    // Add default capabilities for Astrofarm
    // Only add if not already set by the user
    if (!this._sessionCaps['appium:uiautomator2ServerInstallTimeout']) {
      this._updateSessionCap('appium:uiautomator2ServerInstallTimeout', 200000, false);
    }
  }
}
