import {BaseVendor} from './base.js';

export class PerfectoVendor extends BaseVendor {
  /**
   * @override
   */
  async setProperties() {
    const perfecto = this._server.perfecto;
    const vendorName = 'Perfecto';

    const host = perfecto.hostname;
    const securityToken = perfecto.token || process.env.PERFECTO_TOKEN;
    this.checkInputPropertyPresence(vendorName, [
      {name: 'Host', val: host},
      {name: 'SecurityToken', val: securityToken},
    ]);

    const port = perfecto.port || (perfecto.ssl ? 443 : 80);
    const https = perfecto.ssl;
    const path = '/nexperience/perfectomobile/wd/hub';
    this.saveProperties(perfecto, {host, path, port, https, accessKey: securityToken});

    this.updateSessionCap('perfecto:options', {securityToken}, false);
  }
}
