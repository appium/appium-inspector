import {BaseVendor} from './base.js';

export class DeviceFarmVendor extends BaseVendor {
  /**
   * @override
   */
  async configureProperties() {
    const devicefarm = this._server.devicefarm;
    const vendorName = 'DeviceFarm';

    const host = devicefarm.host;
    const accessKey = devicefarm.accessKey;
    const licenseId = devicefarm.licenseId;
    const projectName = devicefarm.projectName;

    this._checkInputPropertyPresence(vendorName, [
      {name: 'Server Host', val: host},
      {name: 'Access Key', val: accessKey},
      {name: 'License ID', val: licenseId},
      {name: 'Project ID', val: projectName},
    ]);

    const port = devicefarm.port || 443;
    const path = `/backend/fireflinkcloud/wd/hub?accessKey=${accessKey}&licenseId=${licenseId}&projectName=${projectName}`;
    const https = parseInt(port, 10) === 443;

    this._saveProperties(devicefarm, {
      host,
      path,
      port,
      https,
      accessKey,
      licenseId,
      projectName,
      vendor: 'devicefarm',
    });
  }
}
