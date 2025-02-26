import i18n from '../../i18next';
import {BaseVendor} from './base';

export class KobitonVendor extends BaseVendor {
  /**
   * @override
   */
  async apply(sessionCaps) {
    const kobiton = this._server.kobiton;
    const host = process.env.KOBITON_HOST || 'api.kobiton.com';
    const port = (kobiton.port = 443);
    const path = (kobiton.path = '/wd/hub');
    const username = kobiton.username || process.env.KOBITON_USERNAME;
    const accessKey = kobiton.accessKey || process.env.KOBITON_ACCESS_KEY;
    sessionCaps['kobiton:options'] = {
      ...(sessionCaps['kobiton:options'] ?? {}),
      source: 'appiumdesktop',
    };
    if (!username || !accessKey) {
      throw new Error(i18n.t('kobitonCredentialsRequired'));
    }
    const https = (kobiton.ssl = true);
    return {
      path,
      host,
      port,
      username,
      accessKey,
      https,
    };
  }
}
