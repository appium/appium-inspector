import {DOMParser} from '@xmldom/xmldom';
import {afterEach, describe, expect, it, vi} from 'vitest';

import {APP_MODE, NATIVE_APP} from '../../app/common/renderer/constants/session-inspector.js';
import {
  canCreateSnapshot,
  createSnapshot,
  getScreenshotMimeType,
  MAX_SNAPSHOT_FILE_SIZE,
  MAX_SNAPSHOT_IMAGE_SIZE,
  MAX_SNAPSHOT_SOURCE_SIZE,
  normalizeSnapshotWindowSize,
  parseSnapshot,
  parseSnapshotForImport,
  SNAPSHOT_FORMAT,
  SNAPSHOT_VERSION,
  SnapshotError,
} from '../../app/common/renderer/utils/snapshot.js';
import {xmlToJSON} from '../../app/common/renderer/utils/source-parsing.js';

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
  afterEach(() => vi.restoreAllMocks());

  it('should identify image types for screenshot rendering and downloads', function () {
    expect(getScreenshotMimeType(PNG)).toBe('image/png');
    expect(getScreenshotMimeType(JPEG)).toBe('image/jpeg');
    expect(getScreenshotMimeType(` \t${PNG}`)).toBe('image/png');
    expect(getScreenshotMimeType(` \t${JPEG.replace(/(.{2})/g, '$1\r\n')}`)).toBe('image/jpeg');
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

    it('should not reparse, decode, encode, or serialize already displayed content', function () {
      const state = {...snapshot(), sourceCapturedAt: snapshot().capturedAt};
      const parseSource = vi.spyOn(DOMParser.prototype, 'parseFromString');
      const decodeImage = vi.spyOn(globalThis, 'atob');
      const encodeText = vi.spyOn(TextEncoder.prototype, 'encode');
      const serialize = vi.spyOn(JSON, 'stringify');

      const result = createSnapshot(state);
      const canCreate = canCreateSnapshot(state);
      expect(parseSource).not.toHaveBeenCalled();
      expect(decodeImage).not.toHaveBeenCalled();
      expect(encodeText).not.toHaveBeenCalled();
      expect(serialize).not.toHaveBeenCalled();
      expect(canCreate).toBe(true);
      expect(result).toEqual(snapshot());
    });

    it.each([
      `<root>${'<a/>'.repeat(10000)}</root>`,
      `${'<a>'.repeat(257)}${'</a>'.repeat(257)}`,
      `<root>${'a'.repeat(MAX_SNAPSHOT_SOURCE_SIZE)}</root>`,
    ])('should not apply untrusted-import source limits to live exports', function (sourceXML) {
      const result = createSnapshot({...snapshot(), sourceXML});
      expect(result.sourceXML).toBe(sourceXML);
      expect(() => parseSnapshot(JSON.stringify(result))).toThrow(/source/);
    });

    it('should allow exporting already displayed wrapped or padded image data', function () {
      const screenshot = btoa(atob(PNG) + '\0\0').replace(/(.{20})/g, '$1\r\n');
      const result = createSnapshot({...snapshot(), screenshot});
      expect(result.screenshot).toBe(screenshot);
      expect(parseSnapshot(JSON.stringify(result)).screenshot).toBe(screenshot.replace(/\s/g, ''));
    });

    it('should share metadata validation with save-button availability', function () {
      expect(canCreateSnapshot(snapshot())).toBe(true);
      for (const overrides of [
        {sourceXML: null},
        {screenshot: null},
        {windowSize: {width: 0, height: 100}},
        {appMode: 'unsupported'},
        {sourceCapturedAt: 'not-a-timestamp'},
        {featureCaps: {platformVersion: -1}},
      ]) {
        const state = {...snapshot(), ...overrides};
        expect(canCreateSnapshot(state)).toBe(false);
        expect(() => createSnapshot(state)).toThrow(SnapshotError);
      }
    });
  });

  describe('#parseSnapshotForImport', function () {
    it('should reuse the validated DOM and ignore an untrusted precomputed tree', function () {
      const expectedTree = xmlToJSON(snapshot().sourceXML);
      const content = JSON.stringify(snapshot({sourceJSON: {injected: true}}));
      const parseSource = vi.spyOn(DOMParser.prototype, 'parseFromString');

      expect(parseSnapshotForImport(content)).toEqual({snapshot: snapshot(), sourceJSON: expectedTree});
      expect(parseSource).toHaveBeenCalledTimes(1);
    });

    it('should reject excessive nesting before recursively converting the validated DOM', function () {
      const content = JSON.stringify(snapshot({sourceXML: `${'<a>'.repeat(257)}${'</a>'.repeat(257)}`}));
      expect(() => parseSnapshotForImport(content)).toThrow('deeply nested');
    });
  });

  describe('#normalizeSnapshotWindowSize', function () {
    it('should preserve finite fractional dimensions and omit unrelated metadata', function () {
      const windowSize = {width: 390.5, height: 844.25, x: 0, y: 0};
      const expected = {width: 390.5, height: 844.25};
      expect(normalizeSnapshotWindowSize(windowSize)).toEqual(expected);
      expect(parse({windowSize}).windowSize).toEqual(expected);
      expect(createSnapshot({...snapshot(), windowSize}).windowSize).toEqual(expected);
      expect(canCreateSnapshot({...snapshot(), windowSize})).toBe(true);
    });

    it.each([null, [], {}, {width: '100', height: 100}, {width: Infinity, height: 100}, {width: NaN, height: 100}])(
      'should reject dimensions that cannot be used for bounds calculations: %j',
      function (windowSize) {
        expect(normalizeSnapshotWindowSize(windowSize)).toBeNull();
      },
    );
  });

  describe('#parseSnapshot', function () {
    it('should round trip a native snapshot without changing XML or image contents', function () {
      expect(parse({})).toEqual(snapshot());
    });

    it('should accept JPEG screenshots', function () {
      expect(parse({screenshot: JPEG}).screenshot).toBe(JPEG);
    });

    it.each([PNG, JPEG])('should normalize MIME-style base64 whitespace', function (screenshot) {
      const wrapped = ` \t\n${screenshot.replace(/(.{20})/g, '$1\r\n')}\t `;
      expect(parse({screenshot: wrapped}).screenshot).toBe(screenshot);
    });

    it.each([PNG, JPEG])('should permit bounded image bytes after the image terminator', function (screenshot) {
      const padded = btoa(atob(screenshot) + '\0\0\r\ntrailing bytes');
      expect(parse({screenshot: padded}).screenshot).toBe(padded);
    });

    it.each([PNG, JPEG])('should still reject images without their required terminator', function (screenshot) {
      const truncated = btoa(atob(screenshot).slice(0, -12));
      expect(() => parse({screenshot: truncated})).toThrow('image dimensions');
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

    it.each([
      '2026-10-24T12:34:56Z',
      '2026-10-24T12:34:56.1Z',
      '2026-10-24T12:34:56.12Z',
      '2026-10-24T12:34:56.123456789Z',
      '2026-10-24T12:34:56+00:00',
      '2026-10-24T12:34:56.123456+00:00',
      '2024-02-29T23:59:59Z',
    ])('should preserve practical ISO8601 UTC timestamps: %s', function (capturedAt) {
      const result = parse({capturedAt});
      expect(result.capturedAt).toBe(capturedAt);
      expect(createSnapshot({...result, snapshotCapturedAt: capturedAt})).toEqual(result);
    });

    it.each([
      'yesterday',
      '2026-02-31T12:34:56.000Z',
      '2026-02-29T12:34:56Z',
      '2026-04-31T12:34:56.123456+00:00',
      '2026-10-24T24:00:00Z',
      '2026-10-24T12:34:60Z',
      '2026-10-24T12:34:56+01:00',
      '2026-10-24T12:34:56',
      '2026-10-24T12:34:56.Z',
      '2026-10-24',
      null,
    ])('should reject an invalid capture time: %j', function (capturedAt) {
      expect(() => parse({capturedAt})).toThrow('capture time');
    });

    it('should accept a usable driver source that produces only XML warnings', function () {
      const sourceXML = '<hierarchy><button enabled=true text=Hello /></hierarchy>';
      const result = parseSnapshotForImport(JSON.stringify(snapshot({sourceXML})));
      expect(result.snapshot.sourceXML).toBe(sourceXML);
      expect(result.sourceJSON.children[0].attributes).toEqual({enabled: 'true', text: 'Hello'});
    });

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
      const sourceXML = `${'<a>'.repeat(256)}${'</a>'.repeat(256)}`;
      expect(parseSnapshotForImport(JSON.stringify(snapshot({sourceXML}))).snapshot.sourceXML).toBe(sourceXML);
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

    it('should retain the decoded-image limit for wrapped base64 before decoding', function () {
      const screenshot = 'A'.repeat(Math.ceil(MAX_SNAPSHOT_IMAGE_SIZE / 3) * 4 + 4).replace(/(.{76})/g, '$1\r\n');
      const decodeImage = vi.spyOn(globalThis, 'atob');
      expect(() => parse({screenshot})).toThrow('20 MiB');
      expect(decodeImage).not.toHaveBeenCalled();
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

    it('should expose stable error codes for localized import feedback', function () {
      expect(() => parseSnapshot('{')).toThrow(expect.objectContaining({name: 'SnapshotError', code: 'invalidJSON'}));
      expect(() => parse({windowSize: {width: 0, height: 100}})).toThrow(
        expect.objectContaining({code: 'invalidWindowSize'}),
      );
      expect(() => parse({sourceXML: '<!DOCTYPE root SYSTEM "file:///etc/passwd"><root/>'})).toThrow(
        expect.objectContaining({code: 'unsafeSource'}),
      );
    });
  });
});
