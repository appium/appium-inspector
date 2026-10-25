import {describe, expect, it} from 'vitest';

import {APP_MODE, NATIVE_APP} from '../../app/common/renderer/constants/session-inspector.js';
import {
  createSnapshot,
  getScreenshotMimeType,
  MAX_SNAPSHOT_FILE_SIZE,
  MAX_SNAPSHOT_IMAGE_SIZE,
  MAX_SNAPSHOT_SOURCE_SIZE,
  parseSnapshot,
  SNAPSHOT_FORMAT,
  SNAPSHOT_VERSION,
} from '../../app/common/renderer/utils/snapshot.js';

const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aRZsAAAAASUVORK5CYII=';
const JPEG =
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD8qqKKKAP/2Q==';

function snapshot(overrides = {}) {
  return {
    format: SNAPSHOT_FORMAT,
    version: SNAPSHOT_VERSION,
    capturedAt: '2026-10-24T12:34:56.000Z',
    sourceXML: '<hierarchy><android.widget.Button text="Hello &amp; welcome" bounds="[0,0][100,40]"/></hierarchy>',
    screenshot: PNG,
    windowSize: {width: 1080, height: 1920},
    currentContext: NATIVE_APP,
    appMode: APP_MODE.NATIVE,
    featureCaps: {automationName: 'uiautomator2', platformName: 'android', platformVersion: 16},
    ...overrides,
  };
}

function parse(overrides) {
  return parseSnapshot(JSON.stringify(snapshot(overrides)));
}

describe('utils/snapshot.js', function () {
  it('should identify image types for screenshot rendering and downloads', function () {
    expect(getScreenshotMimeType(PNG)).toBe('image/png');
    expect(getScreenshotMimeType(JPEG)).toBe('image/jpeg');
  });
  describe('#createSnapshot', function () {
    it('should export the displayed state without connection details or secret capabilities', function () {
      const state = {
        ...snapshot(),
        serverDetails: {username: 'private-user', password: 'private-password', hostname: 'secret-host'},
        sessionCaps: {'provider:options': {accessKey: 'private-key'}},
        featureCaps: {...snapshot().featureCaps, accessKey: 'private-key'},
        driver: {sessionId: 'private-session'},
        sourceJSON: {children: []},
      };
      const result = createSnapshot(state);
      expect(result).toEqual({...snapshot(), capturedAt: result.capturedAt});
      expect(JSON.stringify(result)).not.toContain('private-');
      expect(Number.isFinite(Date.parse(result.capturedAt))).toBe(true);
      expect(parseSnapshot(JSON.stringify(result))).toEqual(result);
    });

    it('should preserve the original timestamp when exporting an offline snapshot again', function () {
      expect(createSnapshot({...snapshot(), snapshotCapturedAt: snapshot().capturedAt})).toEqual(snapshot());
    });

    it('should use the last displayed source capture time when exporting a live session', function () {
      expect(createSnapshot({...snapshot(), sourceCapturedAt: snapshot().capturedAt})).toEqual(snapshot());
    });

    it('should require both a screenshot and source', function () {
      expect(() => createSnapshot({...snapshot(), screenshot: null})).toThrow('screenshot');
      expect(() => createSnapshot({...snapshot(), sourceXML: null})).toThrow('source');
    });

    it('should default the application mode and context for native sessions', function () {
      expect(createSnapshot({...snapshot(), appMode: undefined, currentContext: undefined})).toMatchObject({
        appMode: APP_MODE.NATIVE,
        currentContext: NATIVE_APP,
      });
    });
  });

  describe('#parseSnapshot', function () {
    it('should round trip a native snapshot without changing XML or image contents', function () {
      expect(parse({})).toEqual(snapshot());
    });

    it('should accept JPEG screenshots', function () {
      expect(parse({screenshot: JPEG}).screenshot).toBe(JPEG);
    });

    it('should preserve web context and permit the plain HTML doctype', function () {
      const webSnapshot = {
        appMode: APP_MODE.WEB_HYBRID,
        currentContext: 'WEBVIEW_com.example',
        sourceXML: '<!DOCTYPE html><html><body><button id="submit">Submit</button></body></html>',
        featureCaps: {automationName: 'Chromium', platformName: 'Windows', browserName: 'Chrome'},
      };
      expect(parse(webSnapshot)).toMatchObject({
        ...webSnapshot,
        featureCaps: {automationName: 'chromium', platformName: 'windows', browserName: 'chrome'},
      });
    });

    it('should only restore the documented fields and feature capabilities', function () {
      const result = parse({
        sourceJSON: {injected: true},
        serverDetails: {hostname: 'https://untrusted.invalid'},
        isRecording: true,
        windowSize: {width: 1080, height: 1920, extra: true},
        featureCaps: {...snapshot().featureCaps, unknown: {key: true}},
      });
      expect(result).toEqual(snapshot());
    });

    it.each([null, [], false, 123, 'snapshot'])('should reject a non-object snapshot: %j', function (value) {
      expect(() => parseSnapshot(JSON.stringify(value))).toThrow('supported Appium Inspector snapshot');
    });

    it('should reject invalid JSON and oversized files before parsing', function () {
      expect(() => parseSnapshot('{')).toThrow('not valid JSON');
      expect(() => parseSnapshot(' '.repeat(MAX_SNAPSHOT_FILE_SIZE + 1))).toThrow('50 MiB');
      expect(() => parseSnapshot(null)).toThrow('50 MiB');
    });

    it.each([{format: 'something-else'}, {version: 2}, {version: '1'}, {version: undefined}])(
      'should reject unknown formats or versions: %j',
      function (overrides) {
        expect(() => parse(overrides)).toThrow('supported Appium Inspector snapshot');
      },
    );

    it.each(['yesterday', '2026-02-31T12:34:56.000Z', '2026-10-24', null])(
      'should reject an invalid capture time: %j',
      function (capturedAt) {
        expect(() => parse({capturedAt})).toThrow('capture time');
      },
    );

    it.each([
      '',
      ' ',
      '<root>',
      '<root/><other/>',
      '<root value="&unknown;"/>',
      '<!DOCTYPE root SYSTEM "file:///etc/passwd"><root/>',
      '<!DOCTYPE root [<!ENTITY a "content">]><root>&a;</root>',
    ])('should reject invalid XML or DTD/entity declarations: %s', function (sourceXML) {
      expect(() => parse({sourceXML})).toThrow(/source/);
    });

    it('should bound source size by UTF-8 bytes', function () {
      const sourceXML = `<root>${'a'.repeat(MAX_SNAPSHOT_SOURCE_SIZE)}</root>`;
      expect(() => parse({sourceXML})).toThrow('5 MiB');
      const multibyteSource = `<root>${'\u2603'.repeat(Math.ceil(MAX_SNAPSHOT_SOURCE_SIZE / 3))}</root>`;
      expect(() => parse({sourceXML: multibyteSource})).toThrow('5 MiB');
    });

    it('should reject trees too deeply nested for recursive source rendering', function () {
      expect(() => parse({sourceXML: `${'<a>'.repeat(257)}${'</a>'.repeat(257)}`})).toThrow('deeply nested');
    });

    it('should reject source trees with excessive element counts', function () {
      expect(parse({sourceXML: `<root>${'<a/>'.repeat(9999)}</root>`}).sourceXML).toContain('<root>');
      expect(() => parse({sourceXML: `<root>${'<a/>'.repeat(10000)}</root>`})).toThrow('too large');
    });

    it.each([
      '',
      'not-base64',
      'YQ===',
      'YQ=',
      'YR==',
      'data:image/png;base64,' + PNG,
      'https://untrusted.invalid/screenshot.png',
      btoa('<svg xmlns="http://www.w3.org/2000/svg"/>'),
      PNG.slice(0, -4),
    ])('should reject malformed base64 and unsupported image contents: %s', function (screenshot) {
      expect(() => parse({screenshot})).toThrow('screenshot');
    });

    it('should reject oversized encoded screenshots before decoding', function () {
      expect(() => parse({screenshot: 'A'.repeat(Math.ceil(MAX_SNAPSHOT_IMAGE_SIZE / 3) * 4 + 4)})).toThrow('20 MiB');
    });

    it('should reject image headers with zero dimensions or excessive decoded pixel counts', function () {
      const zeroWidth = Buffer.from(PNG, 'base64');
      zeroWidth.writeUInt32BE(0, 16);
      expect(() => parse({screenshot: zeroWidth.toString('base64')})).toThrow('image dimensions');
      const largeImage = Buffer.from(PNG, 'base64');
      largeImage.writeUInt32BE(20000, 16);
      largeImage.writeUInt32BE(20000, 20);
      expect(() => parse({screenshot: largeImage.toString('base64')})).toThrow('image dimensions');
    });

    it.each([
      null,
      {},
      {width: 0, height: 1},
      {width: 1, height: -1},
      {width: 1.2, height: 100},
      {width: '100', height: 100},
      {width: 100, height: 32769},
    ])('should reject invalid window dimensions: %j', function (windowSize) {
      expect(() => parse({windowSize})).toThrow('window width and height');
    });

    it.each([{appMode: 'invalid'}, {currentContext: ''}, {currentContext: 123}, {currentContext: 'a'.repeat(1025)}])(
      'should reject invalid mode/context values: %j',
      function (overrides) {
        expect(() => parse(overrides)).toThrow('application mode and context');
      },
    );

    it.each([
      null,
      [],
      {automationName: false},
      {platformName: {}},
      {browserName: 'a'.repeat(257)},
      {platformVersion: '16'},
      {platformVersion: -1},
    ])('should reject invalid feature capability values: %j', function (featureCaps) {
      expect(() => parse({featureCaps})).toThrow(/snapshot/);
    });

    it('should accept snapshots without feature capabilities for unknown drivers', function () {
      expect(parse({featureCaps: undefined}).featureCaps).toEqual({});
    });
  });
});
