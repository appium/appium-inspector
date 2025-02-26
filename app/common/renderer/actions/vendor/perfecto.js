import i18n from '../../i18next';
import {BaseVendor} from './base';

export class PerfectoVendor extends BaseVendor {
  /**
   * @override
   */
  async apply(sessionCaps) {
    const perfecto = this._server.perfecto;
    const host = perfecto.hostname;
    const port = perfecto.port || (perfecto.ssl ? 443 : 80);
    const https = perfecto.ssl;
    const path = (perfecto.path = '/nexperience/perfectomobile/wd/hub');
    const accessKey = perfecto.token || process.env.PERFECTO_TOKEN;
    if (!accessKey) {
      throw new Error(i18n.t('Perfecto SecurityToken is required'));
    }
    sessionCaps['perfecto:options'] = {
      ...(sessionCaps['perfecto:options'] ?? {}),
      securityToken: accessKey,
    };
    return {
      path,
      host,
      port,
      accessKey,
      https,
    };
  }
}
