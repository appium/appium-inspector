import {BaseVendor} from './base.js';

export class DeviceFarmVendor extends BaseVendor {
  /**
   * @override
   */
  async configureProperties() {
    const devicefarm = this._server.devicefarm;
    const vendorName = 'DeviceFarm';

    const host = devicefarm.host || process.env.DEVICEFARM_DOMAIN;
    const accessKey = devicefarm.accessKey || process.env.DEVICEFARM_ACCESS_KEY;
    const licenseId = devicefarm.licenseId || process.env.DEVICEFARM_LICENSE_ID;
    const projectName = devicefarm.projectName || process.env.DEVICEFARM_PROJECT_ID;

    this._checkInputPropertyPresence(vendorName, [
      {name: 'Host', val: host},
      {name: 'Access Key', val: accessKey},
      {name: 'License ID', val: licenseId},
      {name: 'Project Name', val: projectName},
    ]);

    const port = 443;
    const https = true;
    const path = `/backend/fireflinkcloud/wd/hub?accessKey=${accessKey}&licenseId=${licenseId}&projectName=${projectName}`;

    this._saveProperties(devicefarm, {
      host,
      path,
      port,
      https,
      accessKey,
    });
  }
}
