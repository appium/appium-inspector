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
    const path = '/nexperience/perfectomobile/wd/hub';
    this._setCommonProperties({vendor: perfecto, host, path, port, https});

    const accessKey = perfecto.token || process.env.PERFECTO_TOKEN;
    if (!accessKey) {
      throw new Error(this._translate('Perfecto SecurityToken is required'));
    }
    this._updateSessionCap(
      'perfecto:options',
      {
        securityToken: accessKey,
      },
      false,
    );
    return {
      path,
      host,
      port,
      accessKey,
      https,
    };
  }
}
