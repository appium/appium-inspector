import {BaseVendor} from './base.js';

export class WebmateVendor extends BaseVendor {
  override async configureProperties(): Promise<void> {
    const webmate = this._server.webmate;
    const vendorName = 'webmate';

    const apiKey =
      (webmate.apiKey as string | undefined) || (process.env.WEBMATE_APIKEY as string | undefined);
    const projectId =
      (webmate.projectId as string | undefined) ||
      (process.env.WEBMATE_PROJECT as string | undefined);
    this._checkInputPropertyPresence(vendorName, [{name: 'API Key', val: apiKey}]);
    const apiKeyDefined = apiKey as string;

    let host = process.env.WEBMATE_HOST || 'selenium.webmate.io';
    if (webmate.useCustomHost) {
      this._checkInputPropertyPresence(vendorName, [
        {name: 'Host', val: webmate.seleniumHost as string | undefined},
      ]);
      host = this._validateUrl(webmate.seleniumHost as string).hostname;
    }
    const path = '/wd/hub';
    const port = 443;
    const https = true;
    this._saveProperties(webmate, {
      host,
      path,
      port,
      https,
      accessKey: apiKeyDefined,
    });

    this._updateSessionCap('wm:apikey', apiKeyDefined);
    if (projectId) {
      this._updateSessionCap('wm:project', projectId);
    }
  }
}
