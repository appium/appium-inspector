import {BaseVendor} from './base.js';

export class RabbitQAVendor extends BaseVendor {
  override async configureProperties(): Promise<void> {
    const rabbitQA = this._server.rabbitqa;
    const vendorName = 'RabbitQA';

    const apiKey =
      (rabbitQA.apiKey as string | undefined) ||
      (process.env.RABBITQA_API_KEY as string | undefined);

    this._checkInputPropertyPresence(vendorName, [{name: 'API Key', val: apiKey}]);
    const apiKeyDefined = apiKey as string;

    const host = 'api.rabbitqa.com';
    const port = 443;
    const path = '/df/wd/hub';
    const https = true;

    this._saveProperties(rabbitQA, {
      host,
      path,
      port,
      https,
      accessKey: apiKeyDefined,
    });

    this._updateSessionCap('df:apiKey', apiKeyDefined, false);
  }
}
