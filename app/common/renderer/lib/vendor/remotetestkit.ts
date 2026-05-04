import {BaseVendor} from './base.js';

export class RemotetestkitVendor extends BaseVendor {
  override async configureProperties(): Promise<void> {
    const remotetestkit = this._server.remotetestkit;
    const vendorName = 'RemoteTestKit';

    const accessToken = remotetestkit.token as string | undefined;
    this._checkInputPropertyPresence(vendorName, [{name: 'AccessToken', val: accessToken}]);

    const host = 'gwjp.appkitbox.com';
    const path = '/wd/hub';
    const port = 443;
    const https = true;
    this._saveProperties(remotetestkit, {
      host,
      path,
      port,
      https,
      accessKey: accessToken as string,
    });

    this._updateSessionCap('remotetestkit:options', {accessToken});
  }
}
