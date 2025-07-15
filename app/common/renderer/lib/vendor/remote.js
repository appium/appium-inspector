import {BaseVendor} from './base.js';

export class RemoteVendor extends BaseVendor {
  /**
   * @override
   */
  async configureProperties() {
    const remote = this._server.remote;

    const host = remote.hostname;
    const port = remote.port;
    const path = remote.path;
    const https = remote.ssl;
    this._saveProperties(remote, {host, path, port, https});
  }
}
