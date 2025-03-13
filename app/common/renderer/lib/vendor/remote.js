import {BaseVendor} from './base.js';

export class RemoteVendor extends BaseVendor {
  /**
   * @override
   */
  async apply() {
    const remote = this._server.remote;

    const host = remote.hostname;
    const port = remote.port;
    const path = remote.path;
    const https = remote.ssl;
    this._setProperties(remote, {host, path, port, https});

    return {
      host,
      port,
      path,
      https,
    };
  }
}
