import {BaseVendor} from './base.js';

export class FireflinkDeviceFarmVendor extends BaseVendor {
  /**
   * @override
   */
  async configureProperties() {
    const fireflinkdevicefarm = this._server.fireflinkdevicefarm;
    const vendorName = 'DeviceFarm';

    const host = fireflinkdevicefarm.host || process.env.DEVICEFARM_DOMAIN;
    const accessKey = fireflinkdevicefarm.accessKey || process.env.DEVICEFARM_ACCESS_KEY;
    const licenseId = fireflinkdevicefarm.licenseId || process.env.DEVICEFARM_LICENSE_ID;
    const projectName = fireflinkdevicefarm.projectName || process.env.DEVICEFARM_PROJECT_ID;

    this._checkInputPropertyPresence(vendorName, [
      {name: 'Host', val: host},
      {name: 'Access Key', val: accessKey},
      {name: 'License ID', val: licenseId},
      {name: 'Project Name', val: projectName},
    ]);

    const port = 443;
    const https = true;
    const path = `/backend/fireflinkcloud/wd/hub?accessKey=${accessKey}&licenseId=${licenseId}&projectName=${projectName}`;

    this._saveProperties(fireflinkdevicefarm, {
      host,
      path,
      port,
      https,
      accessKey,
    });
  }
}
