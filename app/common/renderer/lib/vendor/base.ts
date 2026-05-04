import _ from 'lodash';

import i18n from '../../i18next.js';

export interface VendorProperties {
  host?: string;
  port?: number | string;
  username?: string;
  accessKey?: string;
  https?: boolean;
  path?: string;
  headers?: Record<string, string>;
}

export interface InputProperty {
  name: string;
  val: string | undefined;
}

/** Redux `server` object: keys are server type ids, values are flat field bags */
export type SessionBuilderServer = Record<string, Record<string, unknown>>;

type MutableVendorSlice = Record<string, unknown> & {
  host?: string;
  path?: string;
  port?: number | string;
  ssl?: boolean;
};

export abstract class BaseVendor {
  host?: string;
  port?: number | string;
  path?: string;
  https?: boolean;
  username?: string;
  accessKey?: string;
  headers?: Record<string, string>;

  protected readonly _server: SessionBuilderServer;
  protected readonly _sessionCaps: Record<string, unknown>;

  constructor(server: SessionBuilderServer, sessionCaps: Record<string, unknown>) {
    this._server = server;
    this._sessionCaps = sessionCaps;
  }

  async apply(): Promise<VendorProperties> {
    await this.configureProperties();
    return {
      host: this.host,
      path: this.path,
      port: this.port,
      https: this.https,
      username: this.username,
      accessKey: this.accessKey,
      headers: this.headers,
    };
  }

  protected _checkInputPropertyPresence(vendorName: string, propertyList: InputProperty[]): void {
    const missingProps: string[] = [];
    for (const {name, val} of propertyList) {
      if (!val) {
        missingProps.push(i18n.t(name));
      }
    }
    if (missingProps.length > 0) {
      throw new Error(
        i18n.t('missingVendorProperties', {
          vendorName,
          vendorProps: missingProps.join(', '),
        }),
      );
    }
  }

  protected _validateUrl(url: string): URL {
    try {
      return new URL(url);
    } catch {
      throw new Error(`${i18n.t('Invalid URL:')} ${url}`);
    }
  }

  protected _saveProperties(vendor: MutableVendorSlice, props: VendorProperties): void {
    const {host, path, port, https, username, accessKey, headers} = props;
    this.host = vendor.host = host;
    this.path = vendor.path = path;
    this.port = vendor.port = port;
    this.https = vendor.ssl = https;
    this.username = username;
    this.accessKey = accessKey;
    this.headers = headers;
  }

  protected _updateSessionCap(name: string, value: unknown, merge = true): void {
    const previousValue = this._sessionCaps[name];
    if (merge && _.isPlainObject(previousValue) && _.isPlainObject(value)) {
      this._sessionCaps[name] = {
        ...(previousValue as Record<string, unknown>),
        ...(value as Record<string, unknown>),
      };
    } else {
      this._sessionCaps[name] = value;
    }
  }

  /**
   * ! It is OK for this method to mutate sessionCaps
   */
  abstract configureProperties(): Promise<void>;
}
