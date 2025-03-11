import {BaseVendor} from './base.js';

export class RobotqaVendor extends BaseVendor {
  /**
   * @override
   */
  async apply() {
    const robotqa = this._server.roboticmobi;

    const host = 'remote.robotqa.com';
    const path = '/';
    const port = 443;
    const https = true;
    this._setCommonProperties({vendor: robotqa, host, path, port, https});

    this._updateSessionCap('robotqa:options', {
      robotqa_token: robotqa.token || process.env.ROBOTQA_TOKEN,
    });
    return {
      path,
      host,
      port,
      https,
    };
  }
}
