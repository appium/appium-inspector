import {BaseVendor} from './base.js';

export class RobotActionsVendor extends BaseVendor {
  override async configureProperties(): Promise<void> {
    const robotactions = this._server.robotactions;
    const vendorName = 'RobotActions';

    const token =
      (robotactions.token as string | undefined) ||
      (process.env.ROBOTACTIONS_TOKEN as string | undefined);
    const rawHost =
      process.env.ROBOTACTIONS_WEBDRIVER_URL || (robotactions.host as string | undefined);
    // Parse via URL() so users who paste a full URL (https://acme.example.com),
    // include a port (host:443), or accidentally append a path / trailing slash
    // all end up with just the hostname.
    const trimmed = rawHost?.trim();
    let host: string | undefined;
    if (trimmed) {
      try {
        const withScheme = /^[a-z]+:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
        host = new URL(withScheme).hostname;
      } catch {
        host = trimmed;
      }
    }
    this._checkInputPropertyPresence(vendorName, [
      {name: 'Host', val: host},
      {name: 'Token', val: token},
    ]);
    const tokenDefined = token as string;
    const hostDefined = host as string;
    const headers = {Authorization: `Bearer ${tokenDefined}`};

    const path = '/';
    const port = 443;
    const https = true;
    this._saveProperties(robotactions, {
      host: hostDefined,
      path,
      port,
      https,
      accessKey: tokenDefined,
      headers,
    });
  }
}
