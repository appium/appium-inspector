import {BaseVendor} from './base.js';

export class LocalVendor extends BaseVendor {
  override async configureProperties(): Promise<void> {
    const local = this._server.local;

    const host = local.host === '0.0.0.0' ? 'localhost' : local.hostname;
    const port = local.port as number | string;
    this._saveProperties(local, {host: host as string, port});
  }
}
