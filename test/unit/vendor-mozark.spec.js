import {afterEach, describe, expect, it, vi} from 'vitest';

import {SERVER_TYPES} from '../../app/common/renderer/constants/session-builder.js';
import {VENDOR_MAP} from '../../app/common/renderer/lib/vendor/map.js';

vi.mock('../../app/common/renderer/i18next.js', () => ({
  default: {t: (key, opts) => (opts ? `${key} ${JSON.stringify(opts)}` : key)},
}));

async function startMozarkSession(form, caps = {}) {
  const Vendor = VENDOR_MAP[SERVER_TYPES.MOZARK];
  const props = await new Vendor({mozark: form}, caps).apply();
  return {props, caps};
}

describe('Mozark vendor', function () {
  afterEach(function () {
    vi.unstubAllEnvs();
  });

  it('sends the token from MOZARK_TOKEN to the Mozark hub', async function () {
    vi.stubEnv('MOZARK_TOKEN', 'env-token');
    const {props, caps} = await startMozarkSession({});
    expect(props).toMatchObject({host: 'appium-hub.mozark.ai', port: 443, path: '/wd/hub', https: true});
    expect(caps['mozark:options']).toEqual({secret: 'env-token'});
  });

  it('prefers credentials typed in the form over environment variables', async function () {
    vi.stubEnv('MOZARK_TOKEN', 'env-token');
    const {caps} = await startMozarkSession({username: 'qa-user', apiKey: 'typed-key'});
    expect(caps['mozark:options']).toEqual({username: 'qa-user', apiKey: 'typed-key'});
  });

  it('keeps the device filters the user already set in mozark:options', async function () {
    const {caps} = await startMozarkSession(
      {token: 'typed-token'},
      {'mozark:options': {device: {platform: 'android'}}},
    );
    expect(caps['mozark:options']).toEqual({device: {platform: 'android'}, secret: 'typed-token'});
  });

  it('refuses to start without a token or a username and API key', async function () {
    await expect(startMozarkSession({username: 'qa-user'})).rejects.toThrow('API Key');
  });
});
