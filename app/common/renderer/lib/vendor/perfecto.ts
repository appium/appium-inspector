import {BaseVendor} from './base.js';

export class PerfectoVendor extends BaseVendor {
  override async configureProperties(): Promise<void> {
    const perfecto = this._server.perfecto;
    const vendorName = 'Perfecto';

    const host = perfecto.hostname as string | undefined;
    const securityToken =
      (perfecto.token as string | undefined) || (process.env.PERFECTO_TOKEN as string | undefined);
    this._checkInputPropertyPresence(vendorName, [
      {name: 'Host', val: host},
      {name: 'SecurityToken', val: securityToken},
    ]);

    const ssl = perfecto.ssl;
    const port = (perfecto.port as number | string | undefined) || (ssl ? 443 : 80);
    const https = ssl as boolean | undefined;
    const path = '/nexperience/perfectomobile/wd/hub';
    this._saveProperties(perfecto, {
      host: host as string,
      path,
      port,
      https,
      accessKey: securityToken as string,
    });

    this._updateSessionCap('perfecto:options', {securityToken}, false);
  }
}
