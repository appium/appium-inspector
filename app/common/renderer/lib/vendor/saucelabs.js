import moment from 'moment';

import {BaseVendor} from './base.js';

const SAUCE_OPTIONS_CAP = 'sauce:options';

export class SaucelabsVendor extends BaseVendor {
  /**
   * @override
   */
  async configureProperties() {
    const sauce = this._server.sauce;
    const vendorName = 'Sauce Labs';

    const username = sauce.username || process.env.SAUCE_USERNAME;
    const accessKey = sauce.accessKey || process.env.SAUCE_ACCESS_KEY;
    this._checkInputPropertyPresence(vendorName, [
      {name: 'Username', val: username},
      {name: 'Access Key', val: accessKey},
    ]);

    let host = `ondemand.${sauce.dataCenter}.saucelabs.com`;
    let port = 80;
    if (sauce.useSCProxy) {
      host = sauce.scHost || 'localhost';
      port = parseInt(sauce.scPort, 10) || 4445;
    }
    const path = '/wd/hub';
    const https = false;
    this._saveProperties(sauce, {host, path, port, https, username, accessKey});

    if (!this._sessionCaps[SAUCE_OPTIONS_CAP]?.name) {
      const dateTime = moment().format('lll');
      this._updateSessionCap(SAUCE_OPTIONS_CAP, {
        name: `Appium Desktop Session -- ${dateTime}`,
      });
    }
  }
}
