import {BaseVendor} from './base.js';

export class LocalVendor extends BaseVendor {
  /**
   * @override
   */
  async configureProperties() {
    const local = this._server.local;

    // if we're on windows, we won't be able to connect directly to '0.0.0.0'
    // so just connect to localhost; if we're listening on all interfaces,
    // that will of course include 127.0.0.1 on all platforms
    const host = local.host === '0.0.0.0' ? 'localhost' : local.hostname;
    const port = local.port;
    this._saveProperties(local, {host, port});
  }
}
