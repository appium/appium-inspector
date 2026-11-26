import {BaseVendor} from './base.js';

type MozarkCredentials = {secret: string} | {username: string; apiKey: string};

function pickCredentials(token?: string, username?: string, apiKey?: string): MozarkCredentials | undefined {
  if (token) {
    return {secret: token};
  }
  if (username && apiKey) {
    return {username, apiKey};
  }
  return undefined;
}

export class MozarkVendor extends BaseVendor {
  override async configureProperties(): Promise<void> {
    const mozark = this._server.mozark as {token?: string; username?: string; apiKey?: string};
    const vendorName = 'Mozark';

    const credentials =
      pickCredentials(mozark.token, mozark.username, mozark.apiKey) ??
      pickCredentials(process.env.MOZARK_TOKEN, process.env.MOZARK_USERNAME, process.env.MOZARK_API_KEY);
    if (!credentials) {
      this._checkInputPropertyPresence(vendorName, [
        {name: 'Username', val: mozark.username},
        {name: 'API Key', val: mozark.apiKey},
      ]);
    }

    const host = process.env.MOZARK_HOST || 'appium-hub.mozark.ai';
    const port = 443;
    const path = '/wd/hub';
    const https = true;
    this._saveProperties(this._server.mozark, {host, path, port, https});

    this._updateSessionCap('mozark:options', credentials);
  }
}
