import {describe, expect, it} from 'vitest';

import {sanitizeUrlState} from '../../app/common/renderer/utils/url-state.js';

const CAPS = [{type: 'text', name: 'platformName', value: 'Android'}];

describe('utils/url-state.js', function () {
  describe('#sanitizeUrlState', function () {
    it('should keep capabilities and a session id to attach to', function () {
      expect(sanitizeUrlState({caps: CAPS, attachSessId: 'abc'})).toEqual({
        state: {caps: CAPS, attachSessId: 'abc'},
        dropped: [],
      });
    });

    it('should keep a remote server', function () {
      const server = {remote: {hostname: 'grid.example', port: 4444, path: '/wd/hub', ssl: true}};
      expect(sanitizeUrlState({serverType: 'remote', server})).toEqual({
        state: {serverType: 'remote', server},
        dropped: [],
      });
    });

    it('should keep the advanced server options', function () {
      const server = {advanced: {allowUnauthorized: true, useProxy: true, proxy: 'http://proxy.example:8080'}};
      expect(sanitizeUrlState({server})).toEqual({state: {server}, dropped: []});
    });

    it('should drop cloud vendors, which fall back to credentials from environment variables', function () {
      const {state, dropped} = sanitizeUrlState({
        serverType: 'sauce',
        server: {sauce: {useSCProxy: true, scHost: 'attacker.example'}, pcloudy: {hostname: 'attacker.example'}},
      });
      expect(state).toEqual({});
      expect(dropped).toEqual(['serverType', 'server.sauce', 'server.pcloudy']);
    });

    it('should drop unknown and mistyped server fields', function () {
      const {state, dropped} = sanitizeUrlState({
        server: {remote: {hostname: 'grid.example', headers: {a: 'b'}, ssl: 'yes'}, advanced: {proxy: 1}},
      });
      expect(state).toEqual({server: {remote: {hostname: 'grid.example'}}});
      expect(dropped).toEqual(['server.remote.headers', 'server.remote.ssl', 'server.advanced.proxy']);
    });

    it('should drop invalid capabilities and unrelated builder state', function () {
      const {state, dropped} = sanitizeUrlState({caps: [{name: 'x'}], visibleProviders: ['sauce']});
      expect(state).toEqual({});
      expect(dropped).toEqual(['caps', 'visibleProviders']);
    });

    it.each([null, [], 'state', 1])('should ignore a state of %j', function (state) {
      expect(sanitizeUrlState(state).state).toEqual({});
    });
  });
});
