import { BaseVendor } from './base';

export class RemoteVendor extends BaseVendor {
  /**
   * @override
   */
  async apply(/* sessionCaps **/) {
    const remote = this._server.remote;
    return {
      host: remote.hostname,
      port: remote.port,
      path: remote.path,
      https: remote.ssl,
    };
  }
}
