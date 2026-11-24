import {DEFAULT_SERVER_PROPS} from '../constants/webdriver.js';

/**
 * Client for the recordings API of the Inspector Appium plugin (plugins/recorder.mjs).
 * The plugin records every command of every session on the server, whichever client sent it.
 * Its routes live at the server root, whatever base path the WebDriver endpoints use.
 */

/** Origin of a full server URL such as http://127.0.0.1:4723/wd/hub. */
export function originOfServerUrl(serverUrl) {
  return new URL(serverUrl).origin;
}

/** Origin of the remote server configured in the Session Builder (with Inspector defaults). */
export function originOfBuilderServer(remote = {}) {
  const protocol = remote.ssl ? 'https' : 'http';
  const hostname = remote.hostname || DEFAULT_SERVER_PROPS.hostname;
  const port = remote.port || DEFAULT_SERVER_PROPS.port;
  return `${protocol}://${hostname}:${port}`;
}

export function recordingsUrl(origin, sessionId = null, suffix = '') {
  const base = `${origin}/inspector/api/recordings`;
  return sessionId ? `${base}/${encodeURIComponent(sessionId)}${suffix}` : base;
}

async function request(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    // prefer the server's own explanation ({error: '...'}) over the bare status
    let message = `HTTP ${res.status}`;
    try {
      message = (await res.json())?.error || message;
    } catch {
      // not JSON
    }
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return await res.json();
}

/** Summaries of live, recent and saved recordings, newest first. */
export async function listRecordings(origin) {
  return await request(recordingsUrl(origin));
}

/** Full recording: summary, caps, steps, Inspector actions and locators.md text. */
export async function getRecording(origin, sessionId) {
  return await request(recordingsUrl(origin, sessionId));
}

/** Delete a finished recording and its saved files on the server. */
export async function deleteRecording(origin, sessionId) {
  return await request(recordingsUrl(origin, sessionId), {method: 'DELETE'});
}

/** Only finished recordings can be deleted; a running one must be stopped first. */
export const canDeleteRecording = (rec) => rec.state === 'finished';

/** start | stop | pause | resume a session's recording; returns its new summary. */
export async function controlRecording(origin, sessionId, action) {
  return await request(recordingsUrl(origin, sessionId, `/${action}`), {method: 'POST'});
}

/** Whether a list entry can be recorded: a live session that was never recorded (a stopped recording is final). */
export const canStartRecording = (rec) => !!rec.sessionLive && rec.state === 'idle';

/** One-line target of a recorded step: locator, script name or value. */
export function describeStepTarget(step) {
  const locator = (el) => {
    if (!el) {
      return '';
    }
    if (el.suggested) {
      return `${el.suggested.strategy}: ${el.suggested.selector} ★`;
    }
    if (!el.strategy) {
      return `(no locator: ${el.elementId})`;
    }
    return `${el.strategy}: ${el.selector}${el.isArray ? ` (item ${el.index})` : ''}`;
  };
  if (step.element) {
    return locator(step.element);
  }
  if (step.script) {
    const els = (step.elements ?? []).map(locator).filter(Boolean);
    return els.length ? `${step.script} → ${els.join(', ')}` : step.script;
  }
  return '';
}

/** Value column of a recorded step (typed text, read result, url...). */
/** A read that involves no element (e.g. windows: getWindows): shown briefly, not as a check. */
export const isScoutingStep = (step) =>
  step.action === 'read' && !!step.script && !step.element && !step.elements?.length;

export function describeStepValue(step) {
  if (isScoutingStep(step)) {
    return '';
  }
  if (step.action === 'read') {
    return `${step.what} = ${JSON.stringify(step.result ?? null)}`;
  }
  if (step.value !== undefined) {
    return typeof step.value === 'string' ? step.value : JSON.stringify(step.value);
  }
  return '';
}
