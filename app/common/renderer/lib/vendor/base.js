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
   * Validate the presence of one or more properties that the user can enter in the Inspector GUI
   *
   * @param {string} vendorName
   * @param {List<InputProperty>} propertyList
   */
  _checkInputPropertyPresence(vendorName, propertyList) {
    const missingProps = [];
    for (const prop in propertyList) {
      if (!prop.val) {
        missingProps.push(this._t(prop.name));
      }
    }
    if (missingProps.length > 0) {
      throw new Error(
        this._t('missingVendorProperties', {
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
      throw new Error(`${this._translate('Invalid URL:')} ${webdriverUrl}`);
    }
    return webdriverUrl;
  }

  /**
   * Set the properties common to all vendors (host/path/port/https)
   *
   * @param {VendorCommonProperties}
   */
  _setCommonProperties({vendor, host, path, port, https}) {
    // It is fine to assign all parameters to 'vendor' values -
    // they are only saved in Redux and not sent to the actual server
    this.host = vendor.host = host;
    this.path = vendor.path = path;
    this.port = vendor.port = port;
    this.https = vendor.ssl = https;
  }

  /**
   * Set one or more vendor-specific access properties
   *
   * @param {VendorAccessProperties}
   */
  _setAccessProperties({username, accessKey, headers}) {
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
 * @typedef {Object} VendorCommonProperties
 * @property {Object} [vendor] Vendor properties entered through the Inspector user interface
 * @property {string} [host='127.0.0.1'] Server host name
 * @property {number|string} [port=4723] Server port
 * @property {boolean} [https=false] Whether to use https protocol while connecting to the server
 * @property {string} [path='/'] Server pathname
 */

/**
 * @typedef {Object} VendorAccessProperties
 * @property {string} [username] Optional username for authenticating to vendor service
 * @property {string} [accessKey] Optional password/access key for authenticating to vendor service
 * @property {Record<string, string>} [headers] Optional server headers
 */

/**
 * @typedef {Object} InputProperty
 * @property {string} [name] Property name (used in error messages if no value is provided)
 * @property {string} [val] Property value
 */
