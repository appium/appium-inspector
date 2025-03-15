import {BaseVendor} from './base.js';

export class RemotetestkitVendor extends BaseVendor {
  /**
   * @override
   */
  async setProperties() {
    const remotetestkit = this._server.remotetestkit;
    const vendorName = 'RemoteTestKit';

    const accessToken = remotetestkit.token;
    this.checkInputPropertyPresence(vendorName, [{name: 'AccessToken', val: accessToken}]);

    const host = 'gwjp.appkitbox.com';
    const path = '/wd/hub';
    const port = 443;
    const https = true;
    this.saveProperties(remotetestkit, {host, path, port, https, accessKey: accessToken});

    this.updateSessionCap('remotetestkit:options', {accessToken});
  }
}
