import {BaseVendor} from './base.js';

export class RemotetestkitVendor extends BaseVendor {
  /**
   * @override
   */
  async apply() {
    const remotetestkit = this._server.remotetestkit;

    const host = 'gwjp.appkitbox.com';
    const path = '/wd/hub';
    const port = 443;
    const https = true;
    this._setCommonProperties({vendor: remotetestkit, host, path, port, https});

    this._updateSessionCap('remotetestkit:options', {
      accessToken: remotetestkit.token,
    });
    return {
      path,
      host,
      port,
      https,
    };
  }
}
