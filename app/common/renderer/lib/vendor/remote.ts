import {BaseVendor} from './base.js';

export class RemoteVendor extends BaseVendor {
  override async configureProperties(): Promise<void> {
    const remote = this._server.remote;

    const host = remote.hostname as string;
    const port = remote.port as number | string;
    const path = remote.path as string | undefined;
    const https = remote.ssl as boolean | undefined;
    this._saveProperties(remote, {host, path, port, https});
  }
}
