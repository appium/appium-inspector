import {BaseVendor} from './base.js';

export class RemotetestkitVendor extends BaseVendor {
  /**
   * @override
   */
  async setProperties() {
    const remotetestkit = this._server.remotetestkit;
    const vendorName = 'RemoteTestKit';

    const token = remotetestkit.token;
    this._checkInputPropertyPresence(vendorName, [{name: 'AccessToken', val: token}]);

    const host = 'gwjp.appkitbox.com';
    const path = '/wd/hub';
    const port = 443;
    const https = true;
    this._saveProperties(remotetestkit, {host, path, port, https, accessKey: token});

    this._updateSessionCap('remotetestkit:options', {
      accessToken: token,
    });
  }
}
