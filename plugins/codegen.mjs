/**
 * Test code for a recording, generated on the server with the Inspector's own client-framework
 * generators (the same code the Recorder tab shows), so clients without the Inspector UI, such as
 * an AI agent calling 'inspector: getRecording', get it too.
 */
import {CLIENT_FRAMEWORK_MAP} from './inspector-lib.mjs';

// friendly names accepted in addition to the Inspector's framework ids
const FORMAT_ALIASES = {
  python: 'python',
  java: 'java',
  junit4: 'java',
  'java-junit4': 'java',
  junit5: 'javaJUnit5',
  'java-junit5': 'javaJUnit5',
  js: 'jsWdIo',
  javascript: 'jsWdIo',
  wdio: 'jsWdIo',
  webdriverio: 'jsWdIo',
  oxygen: 'jsOxygen',
  ruby: 'ruby',
  csharp: 'dotNetNUnit',
  'c#': 'dotNetNUnit',
  dotnet: 'dotNetNUnit',
  nunit: 'dotNetNUnit',
  robot: 'robot',
};

export const SUPPORTED_FORMATS = [...new Set([...Object.keys(FORMAT_ALIASES), ...Object.keys(CLIENT_FRAMEWORK_MAP)])];

/** Inspector framework id for a format name, or null when unknown. */
export function resolveFormat(format) {
  if (!format) {
    return null;
  }
  const key = String(format).trim();
  if (CLIENT_FRAMEWORK_MAP[key]) {
    return key;
  }
  return FORMAT_ALIASES[key.toLowerCase()] ?? null;
}

/**
 * @param {import('./recorder.mjs').SessionRecording} rec
 * @param {string} format framework id or alias (python, java, junit5, wdio, csharp, ruby, robot, oxygen)
 * @param {{serverUrl?: string, boilerplate?: boolean}} [opts]
 */
export function generateCode(rec, format, {serverUrl = 'http://127.0.0.1:4723', boilerplate = false} = {}) {
  const id = resolveFormat(format);
  if (!id) {
    throw new Error(`Unknown code format '${format}'. Use one of: ${SUPPORTED_FORMATS.join(', ')}`);
  }
  const url = new URL(serverUrl);
  const parts = {protocol: url.protocol.replace(':', ''), hostname: url.hostname, port: url.port, path: '/'};
  const Framework = CLIENT_FRAMEWORK_MAP[id];
  const fw = new Framework(serverUrl, parts, rec.caps ?? {});
  fw.actions = rec.toInspectorActions();
  return {format: id, language: Framework.readableName, code: fw.getCodeString(!!boilerplate)};
}
