import {BaseVendor} from './base.js';

export class RobotqaVendor extends BaseVendor {
  /**
   * @override
   */
  async setProperties() {
    const robotqa = this._server.roboticmobi;
    const vendorName = 'RobotQA';

    const token = robotqa.token || process.env.ROBOTQA_TOKEN;
    this.checkInputPropertyPresence(vendorName, [{name: 'Token', val: token}]);

    const host = 'remote.robotqa.com';
    const path = '/';
    const port = 443;
    const https = true;
    this.saveProperties(robotqa, {host, path, port, https, accessKey: token});

    this.updateSessionCap('robotqa:options', {
      robotqa_token: token,
    });
  }
}
