import {BaseVendor} from './base.js';

export class RobotqaVendor extends BaseVendor {
  /**
   * @override
   */
  async apply() {
    const roboticmobi = this._server.roboticmobi;
    const host = 'remote.robotqa.com';
    const path = '/';
    const port = 443;
    const https = (roboticmobi.ssl = true);
    this._updateSessionCap('robotqa:options', {
      robotqa_token: roboticmobi.token || process.env.ROBOTQA_TOKEN,
    });
    return {
      path,
      host,
      port,
      https,
    };
  }
}
