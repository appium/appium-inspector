import {DOMParser, MIME_TYPE} from '@xmldom/xmldom';

import {APP_MODE, NATIVE_APP} from '../constants/session-inspector.js';
import {domToJSON} from './source-parsing.js';

export const SNAPSHOT_FORMAT = 'appium-inspector-snapshot';
export const SNAPSHOT_VERSION = 1;
// Import limits apply to UTF-8 JSON/XML and decoded image bytes, independently of file extensions.
export const MAX_SNAPSHOT_FILE_SIZE = 50 * 1024 * 1024;
export const MAX_SNAPSHOT_SOURCE_SIZE = 5 * 1024 * 1024;
export const MAX_SNAPSHOT_IMAGE_SIZE = 20 * 1024 * 1024;
const MAX_DIMENSION = 32768;
const MAX_IMAGE_PIXELS = 40 * 1024 * 1024;
const MAX_SOURCE_DEPTH = 256;
const MAX_SOURCE_NODES = 10000;

/** Validation failures retain stable codes and detailed messages for diagnostics. */
export class SnapshotError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'SnapshotError';
    this.code = code;
  }
}

/** Parses a portable snapshot, rejecting unsupported formats and unsafe or incomplete contents. */
export function parseSnapshot(content) {
  return readSnapshot(content).snapshot;
}

/** Parses and prepares an imported snapshot, reusing the validated XML document for its tree. */
export function parseSnapshotForImport(content) {
  const {snapshot, sourceDoc} = readSnapshot(content);
  return {snapshot, sourceJSON: domToJSON(sourceDoc)};
}

function readSnapshot(content) {
  if (typeof content !== 'string' || byteLength(content) > MAX_SNAPSHOT_FILE_SIZE) {
    throw new SnapshotError('fileSize', 'Snapshot files must be text smaller than 50 MiB.');
  }
  let snapshot;
  try {
    snapshot = JSON.parse(content);
  } catch {
    throw new SnapshotError('invalidJSON', 'The snapshot is not valid JSON.');
  }
  if (!isObject(snapshot) || snapshot.format !== SNAPSHOT_FORMAT || snapshot.version !== SNAPSHOT_VERSION) {
    throw new SnapshotError('unsupportedFormat', 'This is not a supported Appium Inspector snapshot (version 1).');
  }
  const normalized = pickSnapshotFields(snapshot);
  const sourceDoc = validateSource(normalized.sourceXML);
  normalized.screenshot = validateScreenshot(normalized.screenshot);
  return {snapshot: normalized, sourceDoc};
}

/** Creates a snapshot from the currently displayed source and screenshot, excluding connection credentials. */
export function createSnapshot(inspectorState) {
  // Live state has already been parsed and displayed. Do not reparse its source, decode its
  // screenshot, apply untrusted-import tree limits, or serialize it before the actual download.
  return pickSnapshotFields({
    format: SNAPSHOT_FORMAT,
    version: SNAPSHOT_VERSION,
    capturedAt: inspectorState.snapshotCapturedAt || inspectorState.sourceCapturedAt || new Date().toISOString(),
    sourceXML: inspectorState.sourceXML,
    screenshot: inspectorState.screenshot,
    windowSize: inspectorState.windowSize,
    currentContext: inspectorState.currentContext || NATIVE_APP,
    appMode: inspectorState.appMode || APP_MODE.NATIVE,
    featureCaps: inspectorState.featureCaps,
  });
}

/** Whether the displayed state has the fields needed to save a snapshot. */
export function canCreateSnapshot(inspectorState) {
  try {
    createSnapshot(inspectorState);
    return true;
  } catch {
    return false;
  }
}

/** Preserve fractional viewport dimensions while discarding unrelated window metadata. */
export function normalizeSnapshotWindowSize(windowSize) {
  const {width, height} = windowSize || {};
  return isWindowDimension(width) && isWindowDimension(height) ? {width, height} : null;
}

/** Returns the MIME type of a validated inline PNG or JPEG screenshot. */
export function getScreenshotMimeType(screenshot) {
  return /^\s*\/\s*9\s*j\s*\//.test(screenshot) ? 'image/jpeg' : 'image/png';
}

function pickSnapshotFields(snapshot) {
  if (!isUtcTimestamp(snapshot.capturedAt)) {
    throw new SnapshotError('invalidTimestamp', 'The snapshot capture time must be an ISO timestamp in UTC.');
  }
  if (typeof snapshot.sourceXML !== 'string' || !snapshot.sourceXML.length) {
    throw new SnapshotError('sourceSize', 'The snapshot source must be non-empty XML smaller than 5 MiB.');
  }
  if (typeof snapshot.screenshot !== 'string' || !snapshot.screenshot.length) {
    throw new SnapshotError(
      'screenshotSize',
      'The snapshot screenshot must be a base64 PNG or JPEG smaller than 20 MiB.',
    );
  }
  const windowSize = normalizeSnapshotWindowSize(snapshot.windowSize);
  if (!windowSize) {
    throw new SnapshotError('invalidWindowSize', 'The snapshot must include a valid window width and height.');
  }
  if (
    !Object.values(APP_MODE).includes(snapshot.appMode) ||
    typeof snapshot.currentContext !== 'string' ||
    snapshot.currentContext.length > 1024 ||
    !snapshot.currentContext.trim()
  ) {
    throw new SnapshotError('invalidContext', 'The snapshot must include a valid application mode and context.');
  }
  const featureCaps = {};
  if (snapshot.featureCaps !== undefined && !isObject(snapshot.featureCaps)) {
    throw new SnapshotError('invalidFeatureCaps', 'The snapshot feature capabilities must be an object.');
  }
  for (const name of ['automationName', 'platformName', 'browserName']) {
    const value = snapshot.featureCaps?.[name];
    if (value === undefined) {
      continue;
    }
    if (typeof value !== 'string' || value.length > 256) {
      throw new SnapshotError(
        'invalidFeatureCaps',
        `The snapshot ${name} must be a string shorter than 256 characters.`,
      );
    }
    featureCaps[name] = value.toLowerCase();
  }
  const platformVersion = snapshot.featureCaps?.platformVersion;
  if (platformVersion !== undefined) {
    if (typeof platformVersion !== 'number' || !Number.isFinite(platformVersion) || platformVersion < 0) {
      throw new SnapshotError('invalidFeatureCaps', 'The snapshot platformVersion must be a non-negative number.');
    }
    featureCaps.platformVersion = platformVersion;
  }
  // Pick only fields used for offline inspection. Never restore connection details, arbitrary
  // capabilities, settings, driver objects or a precomputed source tree from an imported file.
  return {
    format: SNAPSHOT_FORMAT,
    version: SNAPSHOT_VERSION,
    capturedAt: snapshot.capturedAt,
    sourceXML: snapshot.sourceXML,
    screenshot: snapshot.screenshot,
    windowSize,
    currentContext: snapshot.currentContext,
    appMode: snapshot.appMode,
    featureCaps,
  };
}

function isUtcTimestamp(value) {
  if (typeof value !== 'string' || value.length > 64) {
    return false;
  }
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d+))?(?:Z|\+00:00)$/.exec(value);
  if (!match) {
    return false;
  }
  // Compare calendar fields as well as Date.parse: JavaScript otherwise normalizes dates such
  // as February 31. Preserve the original precision and UTC spelling in the exported snapshot.
  const milliseconds = (match[2] || '').padEnd(3, '0').slice(0, 3);
  const canonical = `${match[1]}.${milliseconds}Z`;
  const time = Date.parse(canonical);
  return Number.isFinite(time) && new Date(time).toISOString() === canonical;
}

function validateSource(sourceXML) {
  if (typeof sourceXML !== 'string' || !sourceXML.trim() || byteLength(sourceXML) > MAX_SNAPSHOT_SOURCE_SIZE) {
    throw new SnapshotError('sourceSize', 'The snapshot source must be non-empty XML smaller than 5 MiB.');
  }
  // A browser's plain HTML doctype is harmless; external identifiers, entity declarations and
  // internal DTD subsets are unnecessary for an Inspector source tree and are not accepted.
  const sourceWithoutHtmlDoctype = sourceXML.replace(/<!DOCTYPE\s+html\s*>/gi, '');
  if (/<!\s*(?:DOCTYPE|ENTITY)\b/i.test(sourceWithoutHtmlDoctype)) {
    throw new SnapshotError('unsafeSource', 'Snapshot source cannot contain DTD or entity declarations.');
  }
  let source;
  try {
    source = new DOMParser({
      onError: (level) => {
        // Drivers may emit recoverable XML warnings (for example, unquoted attributes).
        // Match live inspection for these, but still reject parser errors and fatal errors.
        if (level !== 'warning') {
          throw new Error('Invalid XML');
        }
      },
    }).parseFromString(sourceXML, MIME_TYPE.XML_TEXT);
  } catch {
    throw new SnapshotError('invalidXML', 'The snapshot source is not valid XML.');
  }
  if (!source.documentElement) {
    throw new SnapshotError('invalidXML', 'The snapshot source must contain a document element.');
  }
  // Bound the work performed later by recursive tree rendering and locator generation.
  const pending = [[source.documentElement, 1]];
  let count = 1;
  while (pending.length) {
    const [node, depth] = pending.pop();
    for (let child = node.firstChild; child; child = child.nextSibling) {
      if (child.nodeType === child.ELEMENT_NODE) {
        if (++count > MAX_SOURCE_NODES || depth >= MAX_SOURCE_DEPTH) {
          throw new SnapshotError('sourceTreeSize', 'The snapshot source tree is too large or deeply nested.');
        }
        pending.push([child, depth + 1]);
      }
    }
  }
  return source;
}

function validateScreenshot(screenshot) {
  // The outer file limit bounds whitespace too. Check the normalized encoded length before
  // decoding so MIME-wrapped base64 cannot bypass the decoded-image resource limit.
  screenshot = screenshot.replace(/\s/g, '');
  if (
    !screenshot.length ||
    screenshot.length > Math.ceil(MAX_SNAPSHOT_IMAGE_SIZE / 3) * 4 ||
    screenshot.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(screenshot)
  ) {
    throw new SnapshotError(
      'screenshotSize',
      'The snapshot screenshot must be a base64 PNG or JPEG smaller than 20 MiB.',
    );
  }
  let image;
  try {
    image = atob(screenshot);
  } catch {
    throw new SnapshotError('invalidBase64', 'The snapshot screenshot is not valid base64.');
  }
  if (image.length > MAX_SNAPSHOT_IMAGE_SIZE || btoa(image) !== screenshot) {
    throw new SnapshotError('invalidBase64', 'The snapshot screenshot is not valid base64 or is too large.');
  }
  const size = pngSize(image) || jpegSize(image);
  if (!size || !isDimension(size.width) || !isDimension(size.height) || size.width * size.height > MAX_IMAGE_PIXELS) {
    throw new SnapshotError(
      'invalidImage',
      'The snapshot screenshot must be a PNG or JPEG with valid image dimensions.',
    );
  }
  return screenshot;
}

function pngSize(image) {
  if (!image.startsWith('\x89PNG\r\n\x1a\n')) {
    return null;
  }
  let offset = 8;
  let size;
  let hasImageData = false;
  while (offset + 12 <= image.length) {
    const length = readUint32(image, offset);
    const type = image.slice(offset + 4, offset + 8);
    if (offset + length + 12 > image.length) {
      return null;
    }
    if (offset === 8) {
      if (type !== 'IHDR' || length !== 13) {
        return null;
      }
      size = {width: readUint32(image, offset + 8), height: readUint32(image, offset + 12)};
    }
    hasImageData ||= type === 'IDAT' && length > 0;
    offset += length + 12;
    if (type === 'IEND') {
      // Some screenshot encoders pad the image after IEND. The full decoded payload is still
      // size-bounded, and it is only rendered with an explicit PNG/JPEG MIME type.
      return length === 0 && hasImageData ? size : null;
    }
  }
  return null;
}

function jpegSize(image) {
  if (!image.startsWith('\xff\xd8')) {
    return null;
  }
  let offset = 2;
  while (offset + 4 <= image.length) {
    if (image.charCodeAt(offset++) !== 0xff) {
      return null;
    }
    while (image.charCodeAt(offset) === 0xff) {
      offset++;
    }
    const marker = image.charCodeAt(offset++);
    const length = (image.charCodeAt(offset) << 8) | image.charCodeAt(offset + 1);
    if (length < 2 || offset + length > image.length) {
      return null;
    }
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return length >= 8 && image.indexOf('\xff\xd9', offset + length) !== -1
        ? {
            width: (image.charCodeAt(offset + 5) << 8) | image.charCodeAt(offset + 6),
            height: (image.charCodeAt(offset + 3) << 8) | image.charCodeAt(offset + 4),
          }
        : null;
    }
    if (marker === 0xda || marker === 0xd9) {
      return null;
    }
    offset += length;
  }
  return null;
}

function readUint32(binary, offset) {
  return (
    binary.charCodeAt(offset) * 0x1000000 +
    (binary.charCodeAt(offset + 1) << 16) +
    (binary.charCodeAt(offset + 2) << 8) +
    binary.charCodeAt(offset + 3)
  );
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isDimension(value) {
  return Number.isInteger(value) && value > 0 && value <= MAX_DIMENSION;
}

function isWindowDimension(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= MAX_DIMENSION;
}

function byteLength(value) {
  // Check character length first to avoid allocating a second oversized buffer.
  return value.length > MAX_SNAPSHOT_FILE_SIZE ? value.length : new TextEncoder().encode(value).byteLength;
}
