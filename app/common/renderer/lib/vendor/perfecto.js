import {BaseVendor} from './base.js';

export class PerfectoVendor extends BaseVendor {
  /**
   * @override
   */
  async apply() {
    const perfecto = this._server.perfecto;
    const host = perfecto.hostname;
    const port = perfecto.port || (perfecto.ssl ? 443 : 80);
    const https = perfecto.ssl;
    const path = (perfecto.path = '/nexperience/perfectomobile/wd/hub');
    const accessKey = perfecto.token || process.env.PERFECTO_TOKEN;
    if (!accessKey) {
      throw new Error(this._translate('Perfecto SecurityToken is required'));
    }
    this._updateSessionCap('perfecto:options', {
      securityToken: accessKey,
    });
    return {
      path,
      host,
      port,
      accessKey,
      https,
    };
  }
}
