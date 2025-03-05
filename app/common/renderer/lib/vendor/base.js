import _ from 'lodash';

import i18n from '../../i18next.js';

export class BaseVendor {
  /**
   *
   * @param {unknown} server
   * @param {Record<string, any>} sessionCaps
   */
  constructor(server, sessionCaps) {
    this._server = server;
    this._sessionCaps = sessionCaps;
    this._translate = (tpl) => i18n.t(tpl);
  }

  /**
   * ! It is OK for this method to mutate sessionCaps
   *
   * @returns {Promise<VendorProperties>}
   */
  async apply() {
    throw new Error(`The apply() method must be implemented for the ${this.constructor.name}`);
  }

  /**
   *
   * @param {string} name
   * @param {any} value
   * @param {boolean} [merge=true]
   */
  _updateSessionCap(name, value, merge = true) {
    const previousValue = this._sessionCaps[name];
    if (merge && _.isPlainObject(previousValue) && _.isPlainObject(value)) {
      this._sessionCaps[name] = {
        ...previousValue,
        ...value,
      };
    } else {
      this._sessionCaps[name] = value;
    }
  }

  /**
   *
   * @param {string} url
   * @returns {URL}
   */
  _validateUrl(url) {
    let webdriverUrl;
    try {
      webdriverUrl = new URL(url);
    } catch {
      throw new Error(`${this._translate('Invalid URL:')} ${webdriverUrl}`);
    }
    return webdriverUrl;
  }
}

/**
 * @typedef {Object} VendorProperties
 * @property {string} [host='127.0.0.1'] Server host name
 * @property {number|string} [port=4723] Server port
 * @property {string} [username] Optional auth username for HTTP basic auth.
 * @property {string} [accessKey] Optional auth password for HTTP basic auth.
 * @property {boolean} [https=false] Whether to use https protocol while conecting to the server
 * @property {string} [path='/'] Server pathname
 * @property {Record<string, string>} [headers] Optional server headers
 */
