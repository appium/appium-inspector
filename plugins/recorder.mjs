/**
 * Server-side command recorder for the Appium Inspector plugin.
 *
 * The plugin's `handle()` passes every command of every session through `recordCommand()`, no matter
 * which client sent it (an AI agent through an MCP server, a test, or the Inspector itself). Element
 * ids are mapped back to the locator that found them, so a finished session can be turned into:
 *   - `steps`: raw, client-independent step list (written to steps.json)
 *   - `toInspectorActions()`: the `{action, params}` list the Inspector's client-framework code
 *     generators already understand (written to actions.json, shown in the Recorder tab)
 *   - `toLocatorsMarkdown()`: one compact line per step with its locator (written to locators.md)
 *
 * Only commands that succeeded are recorded, and finds whose element was never used are left out,
 * so the exploration an AI agent does (failed finds, page source reads, screenshots) does not end
 * up in the recording.
 */
import {mkdir, readdir, readFile, rm, rmdir, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export const W3C_ELEMENT_KEY = 'element-6066-11e4-a52e-4f735466cecf';
export const MJSONWP_ELEMENT_KEY = 'ELEMENT';
export const PASSWORD_PLACEHOLDER = '{{PASSWORD}}';
export const ELEMENT_REF_PREFIX = '__SR_ELEMENT_REF_';

const MAX_VALUE_LENGTH = 500;
const MAX_FINISHED_RECORDINGS = 20;
// the files a saved recording consists of: deleting a recording removes exactly these
const SAVED_FILES = ['steps.json', 'actions.json', 'locators.md'];
const MAX_SAVED_LISTED = 100;
const APP_CAPS = [
  'appium:app',
  'app',
  'appium:appTopLevelWindow',
  'appium:bundleId',
  'appium:appPackage',
  'browserName',
];

const FIND_COMMANDS = new Set(['findElement', 'findElements', 'findElementFromElement', 'findElementsFromElement']);
const ELEMENT_READ_COMMANDS = {
  getText: 'text',
  getName: 'tag name',
  elementDisplayed: 'displayed',
  elementEnabled: 'enabled',
  elementSelected: 'selected',
};
const ELEMENT_NAMED_READ_COMMANDS = {getAttribute: 'attribute', getProperty: 'property'};
const NAVIGATION_COMMANDS = {setUrl: 'navigate', back: 'back', forward: 'forward', refresh: 'refresh'};
// execute scripts whose name looks like this only read state: kept as verification candidates
const READ_SCRIPT = /^[\w-]+:\s*(get|is|selected|allSelected|find|query|list)/i;

// selectors that are likely to break when the app changes
const DYNAMIC_VALUE = /\d{4,}|[0-9a-f]{8}-[0-9a-f]{4}|^(ext-|gen|ui-id|ember|react|mui|:r|j_id|dijit_|uniqName|yui)/i;
const ABSOLUTE_XPATH = /^\/[^/]/;
const INDEXED_XPATH = /\[\d+\]/;

// commands that never change the app's state: the page source read for locator suggestions stays valid
const READ_ONLY_COMMANDS = new Set([
  ...FIND_COMMANDS,
  ...Object.keys(ELEMENT_READ_COMMANDS),
  ...Object.keys(ELEMENT_NAMED_READ_COMMANDS),
  'getPageSource',
  'getScreenshot',
  'getElementScreenshot',
  'getElementRect',
  'getWindowRect',
  'getWindowHandle',
  'getWindowHandles',
  'getTimeouts',
  'getStatus',
  'getSession',
  'getSessions',
  'getContexts',
  'getCurrentContext',
  'getLogTypes',
  'active',
]);

export function isReadOnlyCommand(cmdName, args = []) {
  if (cmdName === 'execute' || cmdName === 'executeAsync') {
    return READ_SCRIPT.test(String(args[0] ?? ''));
  }
  return READ_ONLY_COMMANDS.has(cmdName);
}

/** A read that involves no element (e.g. windows: getWindows): kept in steps.json, commented out in code. */
export function isScoutingStep(st) {
  return st.action === 'read' && !!st.script && !st.element && !st.elements?.length;
}

/** The locator generated code should use: the suggested one when there is one. */
export function effectiveLocator(el) {
  if (el?.suggested) {
    return {...el, strategy: el.suggested.strategy, selector: el.suggested.selector, isArray: false, index: null};
  }
  return el;
}

/** Element id inside a W3C / MJSONWP element reference, or null. */
export function elementIdOf(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const id = value[W3C_ELEMENT_KEY] ?? value[MJSONWP_ELEMENT_KEY];
  return typeof id === 'string' ? id : null;
}

function truncate(value) {
  if (typeof value !== 'string') {
    return value;
  }
  return value.length > MAX_VALUE_LENGTH ? `${value.slice(0, MAX_VALUE_LENGTH)}…` : value;
}

function oneLine(value) {
  return String(value ?? '')
    .replace(/[\r\n\u0085\u2028\u2029]+/g, ' ')
    .trim();
}

/** Reasons a selector may be brittle; empty when it looks stable. */
export function locatorWarnings(strategy, selector) {
  const warnings = [];
  if (!selector) {
    return warnings;
  }
  if (strategy === 'xpath') {
    if (ABSOLUTE_XPATH.test(selector)) {
      warnings.push('absolute xpath');
    }
    if (INDEXED_XPATH.test(selector)) {
      warnings.push('positional index');
    }
  } else if (DYNAMIC_VALUE.test(selector)) {
    warnings.push('value looks generated');
  }
  return warnings;
}

function placeholderFor(id, refs) {
  let idx = refs.indexOf(id);
  if (idx < 0) {
    idx = refs.push(id) - 1;
  }
  return `${ELEMENT_REF_PREFIX}${idx}__`;
}

/**
 * Deep-copies script arguments, replacing every element id with a placeholder string
 * (`__SR_ELEMENT_REF_<n>__`). Element reference objects keep their shape, only the id changes,
 * so code generators just substitute an "id of this element variable" expression.
 * Returns the copy and the element ids in order of appearance.
 */
export function templateElementRefs(value, refs = []) {
  if (Array.isArray(value)) {
    return {template: value.map((item) => templateElementRefs(item, refs).template), refs};
  }
  if (value && typeof value === 'object') {
    const template = {};
    for (const [k, v] of Object.entries(value)) {
      // W3C / MJSONWP element references, and the bare `elementId` some wincore scripts take
      if ((k === W3C_ELEMENT_KEY || k === MJSONWP_ELEMENT_KEY || k === 'elementId') && typeof v === 'string') {
        template[k] = placeholderFor(v, refs);
      } else {
        template[k] = templateElementRefs(v, refs).template;
      }
    }
    return {template, refs};
  }
  return {template: value, refs};
}

export class SessionRecording {
  constructor(sessionId, caps = {}) {
    this.sessionId = sessionId;
    this.caps = caps;
    this.startedAt = new Date().toISOString();
    this.endedAt = null;
    this.savedTo = null;
    this.steps = [];
    /** elementId -> {strategy, selector, isArray, index, findId, parentId} */
    this.elements = new Map();
    this.findCount = 0;
    this.paused = false;
    this.fromDisk = false;
    // whether the Appium session still exists (kept up to date by RecordingStore)
    this.sessionLive = false;
  }

  /** A recording saved by an earlier session (or server run), read back from its steps.json. */
  static fromSaved(doc, dir) {
    const meta = doc?.meta ?? {};
    const rec = new SessionRecording(meta.sessionId ?? path.basename(dir), meta.caps ?? {});
    rec.startedAt = meta.startedAt ?? rec.startedAt;
    rec.endedAt = meta.endedAt ?? rec.startedAt;
    rec.steps = Array.isArray(doc?.steps) ? doc.steps : [];
    rec.savedTo = dir;
    rec.fromDisk = true;
    return rec;
  }

  get active() {
    return !this.endedAt;
  }

  /** What the session drives, for display: the app / window / browser capability. */
  get app() {
    const caps = this.caps ?? {};
    const key = APP_CAPS.find((k) => caps[k]);
    return key ? String(caps[key]) : null;
  }

  clear() {
    this.steps = [];
  }

  /** Remember which locator produced each returned element. */
  recordFind(cmdName, strategy, selector, result, parentId = null) {
    const isArray = cmdName.startsWith('findElements');
    const found = isArray ? (Array.isArray(result) ? result : []) : [result];
    const findId = ++this.findCount;
    found.forEach((ref, index) => {
      const id = elementIdOf(ref);
      if (id) {
        this.elements.set(id, {strategy, selector, isArray, index: isArray ? index : null, findId, parentId});
      }
    });
  }

  /**
   * Ids of the elements a command acts on or reads (in order), as passed by Appium.
   * Used to improve their locators before the command runs.
   */
  elementIdsUsedBy(cmdName, args) {
    switch (cmdName) {
      case 'click':
      case 'clear':
        return [args[0]];
      case 'setValue':
        return [args[1]];
      case 'execute':
      case 'executeAsync':
        return templateElementRefs(args[1] ?? []).refs;
    }
    if (cmdName in ELEMENT_READ_COMMANDS) {
      return [args[0]];
    }
    if (cmdName in ELEMENT_NAMED_READ_COMMANDS) {
      return [args[1]];
    }
    return [];
  }

  /** Elements of a command whose locator is worth improving, each considered once. */
  elementsToUpgrade(cmdName, args, needsUpgrade) {
    if (this.paused) {
      return [];
    }
    return this.elementIdsUsedBy(cmdName, args).filter((id) => {
      if (typeof id !== 'string') {
        return false;
      }
      let el = this.elements.get(id);
      if (!el) {
        el = {strategy: null, selector: null};
        this.elements.set(id, el);
      }
      return !el.upgradeTried && needsUpgrade(el);
    });
  }

  setSuggestedLocator(elementId, suggested) {
    const el = this.elements.get(elementId);
    if (el) {
      el.upgradeTried = true;
      if (suggested && (suggested.strategy !== el.strategy || suggested.selector !== el.selector)) {
        el.suggested = suggested;
      }
    }
  }

  /** Locator description for an element id (null locator when the element came from elsewhere). */
  describeElement(elementId) {
    const known = this.elements.get(elementId);
    if (!known) {
      return {elementId, strategy: null, selector: null};
    }
    const {upgradeTried: _upgradeTried, ...rest} = known;
    const el = {elementId, ...rest};
    if (known.parentId) {
      el.parent = this.describeElement(known.parentId);
    }
    return el;
  }

  addStep(step) {
    if (this.paused) {
      return null; // finds are still tracked while paused, so later steps keep their locators
    }
    const full = {n: this.steps.length + 1, t: new Date().toISOString(), ...step};
    this.steps.push(full);
    return full;
  }

  /**
   * Record one successful command. `args` are the handler arguments as Appium passes them
   * (payload params first, then url params such as the element id).
   * `extra.secret` marks a setValue into a password field.
   */
  recordCommand(cmdName, args, result, extra = {}) {
    if (FIND_COMMANDS.has(cmdName)) {
      const [strategy, selector, parentId] = args;
      this.recordFind(cmdName, strategy, selector, result, cmdName.includes('FromElement') ? parentId : null);
      return null;
    }
    switch (cmdName) {
      case 'click':
        return this.addStep({action: 'click', element: this.describeElement(args[0])});
      case 'clear':
        return this.addStep({action: 'clear', element: this.describeElement(args[0])});
      case 'setValue': {
        const [text, elementId] = args;
        const value = Array.isArray(text) ? text.join('') : String(text ?? '');
        return this.addStep({
          action: 'type',
          element: this.describeElement(elementId),
          value: extra.secret ? PASSWORD_PLACEHOLDER : value,
          secret: !!extra.secret,
        });
      }
      case 'execute':
      case 'executeAsync':
        return this.recordScript(cmdName, args[0], args[1] ?? [], result);
      case 'performActions':
        return this.addStep({action: 'gesture', actions: args[0]});
      case 'keys':
        return this.addStep({action: 'keys', value: Array.isArray(args[0]) ? args[0].join('') : args[0]});
    }
    if (cmdName in ELEMENT_READ_COMMANDS) {
      return this.addStep({
        action: 'read',
        what: ELEMENT_READ_COMMANDS[cmdName],
        element: this.describeElement(args[0]),
        result: truncate(result),
      });
    }
    if (cmdName in ELEMENT_NAMED_READ_COMMANDS) {
      const [name, elementId] = args;
      return this.addStep({
        action: 'read',
        what: `${ELEMENT_NAMED_READ_COMMANDS[cmdName]} ${name}`,
        element: this.describeElement(elementId),
        result: truncate(typeof result === 'string' ? result : JSON.stringify(result)),
      });
    }
    if (cmdName in NAVIGATION_COMMANDS) {
      return this.addStep({action: NAVIGATION_COMMANDS[cmdName], value: args[0]});
    }
    return null;
  }

  recordScript(cmdName, script, scriptArgs, result) {
    const {template, refs} = templateElementRefs(scriptArgs);
    // elements returned by a script (e.g. windows: getWindowElement) have no locator
    const returned = Array.isArray(result) ? result : [result];
    for (const ref of returned) {
      const id = elementIdOf(ref);
      if (id && !this.elements.has(id)) {
        this.elements.set(id, {strategy: null, selector: null, fromScript: script});
      }
    }
    const isRead = READ_SCRIPT.test(script);
    return this.addStep({
      action: isRead ? 'read' : 'execute',
      what: isRead ? `script ${script}` : undefined,
      // a read that involves no element (e.g. windows: getWindows) looks around rather than checks:
      // it stays in steps.json with its result, but the generated code only shows it commented out
      scouting: isRead && refs.length === 0 ? true : undefined,
      script,
      async: cmdName === 'executeAsync',
      args: template,
      elements: refs.map((id) => this.describeElement(id)),
      result: isRead ? truncate(typeof result === 'string' ? result : JSON.stringify(result ?? null)) : undefined,
    });
  }

  // ------------------------------------------------------------------ exports

  /**
   * The step list as Inspector recorder actions, ready for the client-framework code generators.
   * Each element (per find call) gets one variable, declared right before its first use.
   */
  toInspectorActions() {
    const actions = [];
    const varsByFind = new Map(); // findId -> varName
    let varCount = 0;

    const comment = (text) => actions.push({action: 'comment', params: [oneLine(text)]});

    // returns [varName, varIndex] or null when the element has no locator
    const varFor = (recorded) => {
      const el = effectiveLocator(recorded);
      if (!el?.strategy) {
        const origin = el?.fromScript ?? this.elements.get(el?.elementId)?.fromScript;
        comment(
          `Element ${el?.elementId} has no recorded locator${origin ? ` (returned by '${origin}')` : ''}: find it manually`,
        );
        return null;
      }
      // one variable per find call; elements with a suggested locator get their own
      const key = el.suggested ? `element:${el.elementId}` : el.findId;
      if (!varsByFind.has(key)) {
        const varName = `el${++varCount}`;
        varsByFind.set(key, varName);
        if (el.suggested) {
          comment(
            recorded.strategy
              ? `Recorded locator for ${varName} was ${recorded.strategy}: ${recorded.selector}; using the suggested unique ${el.strategy}`
              : `${varName} had no locator (returned by '${recorded.fromScript ?? 'a script'}'); using the suggested unique ${el.strategy}`,
          );
        } else if (el.parent) {
          comment(
            `${varName} was found inside another element (${el.parent.strategy ?? 'unknown'}: ${el.parent.selector ?? '?'}); the search below is not scoped to it`,
          );
        }
        const warnings = locatorWarnings(el.strategy, el.selector);
        if (warnings.length) {
          comment(`Brittle locator for ${varName}: ${warnings.join(', ')}`);
        }
        actions.push({action: 'findAndAssign', params: [el.strategy, el.selector, varName, !!el.isArray]});
      }
      return [varsByFind.get(key), el.isArray ? el.index : null];
    };

    for (const st of this.steps) {
      switch (st.action) {
        case 'click':
        case 'clear': {
          const v = varFor(st.element);
          if (v) {
            actions.push({action: st.action === 'click' ? 'elementClick' : 'elementClear', params: v});
          }
          break;
        }
        case 'type': {
          const v = varFor(st.element);
          if (v) {
            if (st.secret) {
              comment('Password field: replace the placeholder with a secret from your test configuration');
            }
            actions.push({action: 'elementSendKeys', params: [...v, st.value]});
          }
          break;
        }
        case 'read': {
          if (isScoutingStep(st)) {
            actions.push({
              action: 'commentedOut',
              params: ['executeScript', [null, null, st.script, st.args], `scouting call, not needed to replay`],
            });
            break;
          }
          const target = st.element ? varFor(st.element) : null;
          const name = target ? (target[1] === null ? target[0] : `${target[0]}[${target[1]}]`) : null;
          comment(`Verify: ${name ? `${name} ` : ''}${st.what} = ${JSON.stringify(st.result ?? null)}`);
          break;
        }
        case 'execute': {
          const refs = st.elements.map((el) => varFor(el));
          if (st.async) {
            comment(`Async script '${st.script}' was recorded as a sync call`);
          }
          if (Array.isArray(st.args) && st.args.length > 1) {
            comment(`'${st.script}' was called with ${st.args.length} arguments: ${JSON.stringify(st.args.slice(1))}`);
          }
          if (refs.length) {
            actions.push({
              action: 'executeScriptWithElements',
              params: [st.script, st.args, refs, st.elements.map((el) => el.elementId)],
            });
          } else {
            actions.push({action: 'executeScript', params: [null, null, st.script, st.args]});
          }
          break;
        }
        case 'navigate':
          actions.push({action: 'navigateTo', params: [null, null, st.value]});
          break;
        case 'back':
        case 'forward':
        case 'refresh':
          actions.push({action: st.action, params: []});
          break;
        case 'gesture':
          comment(`W3C pointer/key actions were performed here (see steps.json step ${st.n})`);
          break;
        case 'keys':
          comment(`Keys typed: ${JSON.stringify(st.value)}`);
          break;
      }
    }
    return actions;
  }

  /** Compact, framework-neutral summary: one line per step. */
  toLocatorsMarkdown() {
    const locator = (recorded) => {
      const el = effectiveLocator(recorded);
      if (!el) {
        return '';
      }
      if (!el.strategy) {
        return `(no locator, element ${el.elementId})`;
      }
      // not "[n]": that would read as a (1-based) xpath predicate
      const index = el.isArray ? ` (item ${el.index} of the matches)` : '';
      const warnings = locatorWarnings(el.strategy, el.selector);
      const parent = el.parent ? ` inside ${locator(el.parent)}` : '';
      const was = el.suggested
        ? `  (suggested; recorded: ${recorded.strategy ? `${recorded.strategy}: ${recorded.selector}` : 'none'})`
        : '';
      return `${el.strategy}: ${el.selector}${index}${parent}${warnings.length ? `  ⚠ ${warnings.join(', ')}` : ''}${was}`;
    };
    const lines = [
      `# Appium session ${this.sessionId}  (${this.startedAt}${this.endedAt ? ` → ${this.endedAt}` : ', still running'})`,
      `# ${this.steps.length} steps. Raw detail: steps.json n=<N>`,
      '',
    ];
    for (const st of this.steps) {
      const parts = [st.n, st.action.toUpperCase()];
      switch (st.action) {
        case 'click':
        case 'clear':
          parts.push(locator(st.element));
          break;
        case 'type':
          parts.push(locator(st.element), JSON.stringify(st.value));
          break;
        case 'read':
          parts.push(
            st.element ? locator(st.element) : st.script,
            isScoutingStep(st)
              ? 'scouting call (result in steps.json)'
              : `${st.what} = ${JSON.stringify(st.result ?? null)}`,
          );
          break;
        case 'execute':
          parts.push(st.script, st.elements.map(locator).join(' ; '));
          break;
        case 'gesture':
          parts.push('W3C actions');
          break;
        default:
          parts.push(JSON.stringify(st.value ?? ''));
      }
      lines.push(parts.map((p) => oneLine(p)).join(' | '));
    }
    return `${lines.join('\n')}\n`;
  }

  /** recording | paused | finished (finished recordings are always saved to disk) */
  get state() {
    if (this.fromDisk || !this.active) {
      return 'finished';
    }
    return this.paused ? 'paused' : 'recording';
  }

  summary() {
    return {
      sessionId: this.sessionId,
      state: this.state,
      // only a live session can be recorded (again)
      sessionLive: !this.fromDisk && (this.active || this.sessionLive),
      startedAt: this.startedAt,
      endedAt: this.endedAt,
      active: this.active,
      paused: this.paused,
      saved: this.fromDisk,
      steps: this.steps.length,
      savedTo: this.savedTo,
      app: this.app,
      platformName: this.caps?.platformName ?? null,
    };
  }

  toJSON() {
    return {
      ...this.summary(),
      caps: this.caps,
      steps: this.steps,
      actions: this.toInspectorActions(),
      locatorsMd: this.toLocatorsMarkdown(),
    };
  }

  /** Write steps.json, actions.json and locators.md into a new folder under `rootDir`. */
  async save(rootDir) {
    const stamp = this.startedAt.replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
    const dir = path.join(rootDir, `${stamp}_${this.sessionId.slice(0, 8)}`);
    await mkdir(dir, {recursive: true});
    const meta = {...this.summary(), caps: this.caps};
    await writeFile(path.join(dir, 'steps.json'), JSON.stringify({meta, steps: this.steps}, null, 1), 'utf8');
    await writeFile(path.join(dir, 'actions.json'), JSON.stringify(this.toInspectorActions(), null, 1), 'utf8');
    await writeFile(path.join(dir, 'locators.md'), this.toLocatorsMarkdown(), 'utf8');
    this.savedTo = dir;
    return dir;
  }
}

export class RecordingActiveError extends Error {
  constructor(sessionId) {
    super(`The recording of session ${sessionId} is still running: stop it before deleting it.`);
    this.name = 'RecordingActiveError';
  }
}

export class RecordingFinishedError extends Error {
  constructor(sessionId) {
    super(
      `The recording of session ${sessionId} is finished and cannot be continued. ` +
        'Use inspector: pauseRecording / inspector: resumeRecording to leave steps out of a recording.',
    );
    this.name = 'RecordingFinishedError';
  }
}

/** All recordings of this server process, live and recently finished. */
export class RecordingStore {
  constructor(maxFinished = MAX_FINISHED_RECORDINGS) {
    this.maxFinished = maxFinished;
    this.recordings = new Map();
    /** live sessions seen by the plugin: sessionId -> {sessionId, caps, startedAt} */
    this.sessions = new Map();
  }

  get(sessionId) {
    return this.recordings.get(sessionId);
  }

  /**
   * Remember a live session that is not being recorded, so the UI can offer to record it.
   * Cheap on purpose: it runs on every command of every session.
   */
  noteSession(sessionId, caps) {
    const rec = this.recordings.get(sessionId);
    if (rec) {
      rec.sessionLive = true;
    }
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {sessionId, caps: caps ?? {}, startedAt: new Date().toISOString()});
    }
  }

  forgetSession(sessionId) {
    this.sessions.delete(sessionId);
  }

  /** The Appium session ended: its recording (if any) can no longer be continued. */
  sessionEnded(sessionId) {
    this.sessions.delete(sessionId);
    const rec = this.recordings.get(sessionId);
    if (rec) {
      rec.sessionLive = false;
    }
  }

  /** Whether commands of this session are being recorded right now. */
  isRecording(sessionId) {
    const rec = this.recordings.get(sessionId);
    return !!rec && rec.active && !rec.paused;
  }

  /**
   * Start recording a session. A stopped recording is final: continuing it would leave an unmarked gap
   * in the steps, so pause/resume is the way to leave steps out.
   */
  start(sessionId, caps) {
    const existing = this.recordings.get(sessionId);
    if (existing && !existing.active) {
      throw new RecordingFinishedError(sessionId);
    }
    const known = this.sessions.get(sessionId);
    const rec = this.getOrCreate(sessionId, caps ?? known?.caps);
    rec.paused = false;
    rec.sessionLive = true;
    return rec;
  }

  getOrCreate(sessionId, caps) {
    let rec = this.recordings.get(sessionId);
    if (!rec) {
      rec = new SessionRecording(sessionId, caps);
      this.recordings.set(sessionId, rec);
    }
    return rec;
  }

  finish(sessionId) {
    const rec = this.recordings.get(sessionId);
    if (rec && !rec.endedAt) {
      rec.endedAt = new Date().toISOString();
    }
    const finished = [...this.recordings.values()].filter((r) => !r.active);
    for (const old of finished.slice(0, Math.max(0, finished.length - this.maxFinished))) {
      this.recordings.delete(old.sessionId);
    }
    return rec;
  }

  list() {
    return [...this.recordings.values()].map((r) => r.summary());
  }

  /** Live sessions that are not recorded (never started), as list entries. */
  idleSessions() {
    return [...this.sessions.values()]
      .filter((s) => !this.recordings.has(s.sessionId))
      .map((s) => {
        const rec = new SessionRecording(s.sessionId, s.caps);
        return {...rec.summary(), state: 'idle', active: false, sessionLive: true, startedAt: s.startedAt};
      });
  }

  /** Recordings saved under `rootDir` (newest first), read back from their steps.json files. */
  async loadSaved(rootDir) {
    let dirs;
    try {
      dirs = (await readdir(rootDir, {withFileTypes: true})).filter((d) => d.isDirectory()).map((d) => d.name);
    } catch {
      return []; // nothing saved yet
    }
    dirs.sort().reverse();
    const saved = [];
    for (const name of dirs.slice(0, MAX_SAVED_LISTED)) {
      const dir = path.join(rootDir, name);
      try {
        const doc = JSON.parse(await readFile(path.join(dir, 'steps.json'), 'utf8'));
        saved.push(SessionRecording.fromSaved(doc, dir));
      } catch {
        // not a recording folder
      }
    }
    return saved;
  }

  /** Live and in-memory recordings, plus saved ones from earlier server runs, newest first. */
  async listAll(rootDir) {
    const inMemory = [...this.list(), ...this.idleSessions()];
    const known = new Set(inMemory.map((r) => r.sessionId));
    const saved = (await this.loadSaved(rootDir)).filter((r) => !known.has(r.sessionId)).map((r) => r.summary());
    return [...inMemory, ...saved].sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)));
  }

  /**
   * Delete a finished recording: forget it and remove its saved files. Only the recording's own files
   * are removed, and only from a folder directly inside `rootDir`; the folder itself is removed when
   * nothing else is left in it. Returns null when there is no such recording.
   */
  async delete(sessionId, rootDir) {
    const rec = await this.find(sessionId, rootDir);
    if (!rec) {
      return null;
    }
    if (rec.active) {
      throw new RecordingActiveError(sessionId);
    }
    const result = {sessionId, folder: rec.savedTo ?? null, filesRemoved: false, folderRemoved: false};
    if (rec.savedTo) {
      const dir = path.resolve(rec.savedTo);
      if (path.dirname(dir) !== path.resolve(rootDir)) {
        throw new Error(`Refusing to delete files outside the recordings folder: ${dir}`);
      }
      for (const file of SAVED_FILES) {
        await rm(path.join(dir, file), {force: true});
      }
      result.filesRemoved = true;
      try {
        await rmdir(dir);
        result.folderRemoved = true;
      } catch {
        // other files were added to the folder: leave them
      }
    }
    this.recordings.delete(sessionId);
    return result;
  }

  /** In-memory recording, or the saved one with this session id. */
  async find(sessionId, rootDir) {
    return this.get(sessionId) ?? (await this.loadSaved(rootDir)).find((r) => r.sessionId === sessionId);
  }
}

export const store = new RecordingStore();

const isOn = (value) => !['off', '0', 'false', 'no'].includes(String(value ?? 'on').toLowerCase());

/**
 * Settings from the environment:
 *   APPIUM_RECORDER=off|on|all     off: no recorder at all; on (default): sessions are recorded only after
 *                                  'inspector: startRecording', the UI, or the inspectorRecord capability;
 *                                  all: every session is recorded from its start
 *   APPIUM_RECORDER_DIR=<folder>   where finished recordings are saved
 *   APPIUM_RECORDER_LOCATORS=off   keeps the locators clients sent (no page source reads for suggestions)
 */
export function recorderSettings(env = process.env) {
  const mode = String(env.APPIUM_RECORDER ?? 'on').toLowerCase();
  return {
    enabled: isOn(mode),
    recordAll: mode === 'all',
    outputDir: env.APPIUM_RECORDER_DIR || path.join(os.homedir(), 'appium-recordings'),
    suggestLocators: isOn(env.APPIUM_RECORDER_LOCATORS),
  };
}
