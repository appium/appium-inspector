export class BaseVendor {
  constructor(server) {
    this._server = server;
  }

  /**
   * ! It is OK for this method to mutate sessionCaps
   *
   * @param {Record<string, any>} sessionCaps
   * @returns {Promise<VendorProperties>}
   */
  async apply (/* sessionCaps **/) {
    throw new Error(`The apply() method must be implemented for the ${this.constructor.name}`);
  }
}

/**
 * @typedef {Object} VendorProperties
 * @property {string} [host='127.0.0.1'] Server host name
 * @property {number} [port=4723] Server port
 * @property {string} [username] Optional auth username for HTTP basic auth.
 * @property {string} [accessKey] Optional auth password for HTTP basic auth.
 * @property {boolean} [https=false] Whether to use https protocol while conecting to the server
 * @property {string} [path='/'] Server pathname
 * @property {Record<string, string>} [headers] Optional server headers
 */
