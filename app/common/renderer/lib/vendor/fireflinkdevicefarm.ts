import {BaseVendor} from './base.js';

export class FireflinkDeviceFarmVendor extends BaseVendor {
  override async configureProperties(): Promise<void> {
    const fireflinkdevicefarm = this._server.fireflinkdevicefarm;
    const vendorName = 'FireflinkDeviceFarm';

    const host =
      (fireflinkdevicefarm.host as string | undefined) ||
      (process.env.FIREFLINKDEVICEFARM_DOMAIN as string | undefined);
    const accessKey =
      (fireflinkdevicefarm.accessKey as string | undefined) ||
      (process.env.FIREFLINKDEVICEFARM_ACCESS_KEY as string | undefined);
    const licenseId =
      (fireflinkdevicefarm.licenseId as string | undefined) ||
      (process.env.FIREFLINKDEVICEFARM_LICENSE_ID as string | undefined);
    const projectName =
      (fireflinkdevicefarm.projectName as string | undefined) ||
      (process.env.FIREFLINKDEVICEFARM_PROJECT_ID as string | undefined);

    this._checkInputPropertyPresence(vendorName, [
      {name: 'Host', val: host},
      {name: 'Access Key', val: accessKey},
      {name: 'License ID', val: licenseId},
      {name: 'Project Name', val: projectName},
    ]);

    const port = 443;
    const https = true;
    const accessKeyDefined = accessKey as string;
    const licenseIdDefined = licenseId as string;
    const projectNameDefined = projectName as string;
    const path = `/backend/fireflinkcloud/wd/hub?accessKey=${accessKeyDefined}&licenseId=${licenseIdDefined}&projectName=${projectNameDefined}`;

    this._saveProperties(fireflinkdevicefarm, {
      host: host as string,
      path,
      port,
      https,
      accessKey: accessKeyDefined,
    });
  }
}
