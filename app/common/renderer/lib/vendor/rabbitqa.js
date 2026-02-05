import {BaseVendor} from './base.js';

export class RabbitQAVendor extends BaseVendor {
  /**
   * @override
   */
  async configureProperties() {
    const rabbitQA = this._server.rabbitqa;
    const vendorName = 'RabbitQA';

    const apiKey = rabbitQA?.apiKey || process.env.RABBITQA_API_KEY;

    this._checkInputPropertyPresence(vendorName, [
      {name: 'API Key', val: apiKey},
    ]);

    const host = 'api.rabbitqa.com';
    const port = 443;
    const path = '/df/wd/hub';
    const https = true;

    this._saveProperties(rabbitQA, {host, path, port, https, accessKey: apiKey});

    this._updateSessionCap(
      'df:apiKey',
      apiKey,
      false,
    );
  }
}
