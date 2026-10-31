import dayjs, {extend as dayjsExtend} from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat.js';

import {BaseVendor} from './base.js';

dayjsExtend(localizedFormat);

const SAUCE_OPTIONS_CAP = 'sauce:options';

export class SaucelabsVendor extends BaseVendor {
  override async configureProperties(): Promise<void> {
    const sauce = this._server.sauce;
    const vendorName = 'Sauce Labs';

    const username = (sauce.username as string | undefined) || (process.env.SAUCE_USERNAME as string | undefined);
    const accessKey = (sauce.accessKey as string | undefined) || (process.env.SAUCE_ACCESS_KEY as string | undefined);
    this._checkInputPropertyPresence(vendorName, [
      {name: 'Username', val: username},
      {name: 'Access Key', val: accessKey},
    ]);

    // The ondemand endpoints are HTTPS: the first request carries the credentials as Basic
    // auth, so it must never go over plaintext. The data center is checked against the offered
    // ones when a session file is imported (see sessionfile-parsing.js).
    const dataCenter = String(sauce.dataCenter ?? '');
    let host = `ondemand.${dataCenter}.saucelabs.com`;
    let port: number | string = 443;
    let https = true;
    if (sauce.useSCProxy) {
      host = (sauce.scHost as string | undefined) || 'localhost';
      port = parseInt(String(sauce.scPort), 10) || 4445;
      // The Sauce Connect proxy is spoken to over HTTP unless the user enables SSL for it
      https = !!sauce.scSsl;
    }
    const path = '/wd/hub';
    this._saveProperties(sauce, {host, path, port, https, username, accessKey});

    if (!(this._sessionCaps[SAUCE_OPTIONS_CAP] as {name?: unknown} | undefined)?.name) {
      const dateTime = dayjs().format('lll');
      this._updateSessionCap(SAUCE_OPTIONS_CAP, {
        name: `Appium Desktop Session -- ${dateTime}`,
      });
    }
  }
}
