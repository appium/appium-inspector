import {BaseVendor} from './base.js';

export class PerfectoVendor extends BaseVendor {
  /**
   * @override
   */
  async configureProperties() {
    const perfecto = this._server.perfecto;
    const vendorName = 'Perfecto';

    const host = perfecto.hostname;
    const securityToken = perfecto.token || process.env.PERFECTO_TOKEN;
    this._checkInputPropertyPresence(vendorName, [
      {name: 'Host', val: host},
      {name: 'SecurityToken', val: securityToken},
    ]);

    const port = perfecto.port || (perfecto.ssl ? 443 : 80);
    const https = perfecto.ssl;
    const path = '/nexperience/perfectomobile/wd/hub';
    this._saveProperties(perfecto, {host, path, port, https, accessKey: securityToken});

    this._updateSessionCap('perfecto:options', {securityToken}, false);
  }
}
