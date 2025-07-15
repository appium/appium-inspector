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
  }

  /**
   * ! It is OK for this method to mutate sessionCaps
   */
  async configureProperties() {
    throw new Error(
      `The configureProperties() method must be implemented for the ${this.constructor.name}`,
    );
  }

  /**
   * @returns {Promise<VendorProperties>}
   */
  async apply() {
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

  /**
   * Validate the presence of one or more properties that the user can enter in the Inspector GUI
   *
   * @param {string} vendorName
   * @param {InputProperty[]} propertyList
   */
  _checkInputPropertyPresence(vendorName, propertyList) {
    const missingProps = [];
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

  /**
   * Check validity of the WebDriver URL, which may be required by the vendor
   *
   * @param {string} url
   * @returns {URL}
   */
  _validateUrl(url) {
    let webdriverUrl;
    try {
      webdriverUrl = new URL(url);
    } catch {
      throw new Error(`${i18n.t('Invalid URL:')} ${webdriverUrl}`);
    }
    return webdriverUrl;
  }

  /**
   * Locally save all class properties required to access the vendor server
   *
   * @param {Object} vendor
   * @param {VendorProperties} vendorProperties
   */
  _saveProperties(vendor, {host, path, port, https, username, accessKey, headers}) {
    // It is fine to assign all parameters to 'vendor' values -
    // they are only saved in Redux and not sent to the actual server
    this.host = vendor.host = host;
    this.path = vendor.path = path;
    this.port = vendor.port = port;
    this.https = vendor.ssl = https;
    this.username = username;
    this.accessKey = accessKey;
    this.headers = headers;
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
}

/**
 * @typedef {Object} VendorProperties
 * @property {string} [host='127.0.0.1'] Server host name
 * @property {number|string} [port=4723] Server port
 * @property {string} [username] Optional username for authenticating to vendor service
 * @property {string} [accessKey] Optional password/access key for authenticating to vendor service
 * @property {boolean} [https=false] Whether to use https protocol while connecting to the server
 * @property {string} [path='/'] Server pathname
 * @property {Record<string, string>} [headers] Optional server headers
 */

/**
 * @typedef {Object} InputProperty
 * @property {string} name Property name (used in error messages if no value is provided)
 * @property {string} val Property value
 */
