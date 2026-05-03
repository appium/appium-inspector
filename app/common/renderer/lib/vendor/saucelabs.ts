import dayjs, {extend as dayjsExtend} from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat.js';

import {BaseVendor} from './base.js';

dayjsExtend(localizedFormat);

const SAUCE_OPTIONS_CAP = 'sauce:options';

export class SaucelabsVendor extends BaseVendor {
  override async configureProperties(): Promise<void> {
    const sauce = this._server.sauce;
    const vendorName = 'Sauce Labs';

    const username =
      (sauce.username as string | undefined) || (process.env.SAUCE_USERNAME as string | undefined);
    const accessKey =
      (sauce.accessKey as string | undefined) ||
      (process.env.SAUCE_ACCESS_KEY as string | undefined);
    this._checkInputPropertyPresence(vendorName, [
      {name: 'Username', val: username},
      {name: 'Access Key', val: accessKey},
    ]);

    const dataCenter = String(sauce.dataCenter ?? '');
    let host = `ondemand.${dataCenter}.saucelabs.com`;
    let port: number | string = 80;
    if (sauce.useSCProxy) {
      host = (sauce.scHost as string | undefined) || 'localhost';
      port = parseInt(String(sauce.scPort), 10) || 4445;
    }
    const path = '/wd/hub';
    const https = false;
    this._saveProperties(sauce, {host, path, port, https, username, accessKey});

    if (!(this._sessionCaps[SAUCE_OPTIONS_CAP] as {name?: unknown} | undefined)?.name) {
      const dateTime = dayjs().format('lll');
      this._updateSessionCap(SAUCE_OPTIONS_CAP, {
        name: `Appium Desktop Session -- ${dateTime}`,
      });
    }
  }
}
