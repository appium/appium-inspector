import {BaseVendor} from './base.js';

export class RemoteVendor extends BaseVendor {
  /**
   * @override
   */
  async apply() {
    const remote = this._server.remote;
    return {
      host: remote.hostname,
      port: remote.port,
      path: remote.path,
      https: remote.ssl,
    };
  }
}
