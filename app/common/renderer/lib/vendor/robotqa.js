import {BaseVendor} from './base.js';

export class RobotqaVendor extends BaseVendor {
  /**
   * @override
   */
  async configureProperties() {
    const robotqa = this._server.roboticmobi;
    const vendorName = 'RobotQA';

    const token = robotqa.token || process.env.ROBOTQA_TOKEN;
    this._checkInputPropertyPresence(vendorName, [{name: 'Token', val: token}]);

    const host = 'remote.robotqa.com';
    const path = '/';
    const port = 443;
    const https = true;
    this._saveProperties(robotqa, {host, path, port, https, accessKey: token});

    this._updateSessionCap('robotqa:options', {
      robotqa_token: token,
    });
  }
}
