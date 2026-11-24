import {mkdtemp, readFile, rm, stat, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {describe, expect, it} from 'vitest';

import {ELEMENT_REF_PLACEHOLDER} from '../../app/common/renderer/lib/client-frameworks/common.js';
import DotNetNUnitFramework from '../../app/common/renderer/lib/client-frameworks/dotnet-nunit.js';
import JavaJUnit5Framework from '../../app/common/renderer/lib/client-frameworks/java-junit5.js';
import JsWdIoFramework from '../../app/common/renderer/lib/client-frameworks/js-wdio.js';
import PythonFramework from '../../app/common/renderer/lib/client-frameworks/python.js';
import {
  describeStepTarget,
  describeStepValue,
  originOfBuilderServer,
  originOfServerUrl,
  recordingsUrl,
} from '../../app/common/renderer/utils/server-recordings.js';
import {
  ELEMENT_REF_PREFIX,
  locatorWarnings,
  PASSWORD_PLACEHOLDER,
  recorderSettings,
  RecordingStore,
  SessionRecording,
  templateElementRefs,
  W3C_ELEMENT_KEY,
} from '../../plugins/recorder.mjs';

const ref = (id) => ({[W3C_ELEMENT_KEY]: id});
const SERVER_URL = 'http://127.0.0.1:4723';
const SERVER_URL_PARTS = {protocol: 'http', hostname: '127.0.0.1', port: '4723', path: '/'};

function generate(Framework, actions) {
  const fw = new Framework(SERVER_URL, SERVER_URL_PARTS, {platformName: 'Windows'});
  fw.actions = actions;
  return fw.getCodeString(false);
}

/** A typical AI-agent session through an MCP server: exploration, then a login. */
function loginSession() {
  const rec = new SessionRecording('abcdef12-3456', {platformName: 'Windows'});
  rec.recordCommand('getPageSource', [], '<xml/>');
  rec.recordCommand('findElement', ['accessibility id', 'UnusedButton'], ref('e0'));
  rec.recordCommand('findElement', ['accessibility id', 'UserName'], ref('e1'));
  rec.recordCommand('click', ['e1'], null);
  rec.recordCommand('setValue', ['admin', 'e1'], null);
  rec.recordCommand('findElement', ['accessibility id', 'Password'], ref('e2'));
  rec.recordCommand('setValue', [['s', '3', 'c'], 'e2'], null, {secret: true});
  rec.recordCommand('findElements', ['xpath', '//Button'], [ref('b0'), ref('b1')]);
  rec.recordCommand('execute', ['windows: invoke', [ref('b1')]], null);
  rec.recordCommand('findElement', ['name', 'Status'], ref('e3'));
  rec.recordCommand('getText', ['e3'], 'Welcome');
  rec.recordCommand('getScreenshot', [], 'base64…');
  return rec;
}

describe('plugin recorder', function () {
  it('uses the same element placeholder as the code generators', function () {
    expect(ELEMENT_REF_PREFIX).toBe(ELEMENT_REF_PLACEHOLDER);
  });

  describe('SessionRecording steps', function () {
    it('records only actions and reads, with the locator of each element', function () {
      const rec = loginSession();
      expect(rec.steps.map((s) => s.action)).toEqual(['click', 'type', 'type', 'execute', 'read']);
      expect(rec.steps[0].element).toMatchObject({strategy: 'accessibility id', selector: 'UserName'});
      expect(rec.steps[3].elements[0]).toMatchObject({strategy: 'xpath', selector: '//Button', index: 1});
      expect(rec.steps[4]).toMatchObject({what: 'text', result: 'Welcome'});
    });

    it('masks text typed into password fields', function () {
      const step = loginSession().steps[2];
      expect(step).toMatchObject({value: PASSWORD_PLACEHOLDER, secret: true});
      expect(JSON.stringify(loginSession().toJSON())).not.toContain('s3c');
    });

    it('treats getter scripts as reads and keeps elements they return as locator-less', function () {
      const rec = new SessionRecording('s1');
      rec.recordCommand('execute', ['windows: getWindowElement', [{}]], ref('w1'));
      rec.recordCommand('click', ['w1'], null);
      expect(rec.steps[0]).toMatchObject({action: 'read', script: 'windows: getWindowElement'});
      expect(rec.steps[1].element).toMatchObject({strategy: null, fromScript: 'windows: getWindowElement'});
    });

    it('remembers the parent of elements found from another element', function () {
      const rec = new SessionRecording('s1');
      rec.recordCommand('findElement', ['name', 'Form'], ref('p1'));
      rec.recordCommand('findElementFromElement', ['name', 'OK', 'p1'], ref('c1'));
      rec.recordCommand('click', ['c1'], null);
      expect(rec.steps[0].element.parent).toMatchObject({selector: 'Form'});
    });
  });

  describe('templateElementRefs', function () {
    it('replaces ids in element references and bare elementId keys, keeping their shape', function () {
      const {template, refs} = templateElementRefs([{...ref('a'), x: 1}, {elementId: 'b', value: 'v'}, ref('a')]);
      expect(refs).toEqual(['a', 'b']);
      expect(template).toEqual([
        {[W3C_ELEMENT_KEY]: `${ELEMENT_REF_PREFIX}0__`, x: 1},
        {elementId: `${ELEMENT_REF_PREFIX}1__`, value: 'v'},
        {[W3C_ELEMENT_KEY]: `${ELEMENT_REF_PREFIX}0__`},
      ]);
    });
  });

  describe('toInspectorActions', function () {
    it('declares each used element once and drops unused finds', function () {
      const actions = loginSession().toInspectorActions();
      const finds = actions.filter((a) => a.action === 'findAndAssign').map((a) => a.params);
      expect(finds).toEqual([
        ['accessibility id', 'UserName', 'el1', false],
        ['accessibility id', 'Password', 'el2', false],
        ['xpath', '//Button', 'el3', true],
        ['name', 'Status', 'el4', false],
      ]);
      expect(actions).toContainEqual({action: 'elementClick', params: ['el1', null]});
      expect(actions).toContainEqual({action: 'elementSendKeys', params: ['el2', null, PASSWORD_PLACEHOLDER]});
      expect(actions).toContainEqual({action: 'comment', params: ['Verify: el4 text = "Welcome"']});
    });

    it('generates runnable code with element ids in script arguments', function () {
      const actions = loginSession().toInspectorActions();
      const python = generate(PythonFramework, actions);
      expect(python).toContain('el1.click()');
      expect(python).toContain(`driver.execute_script("windows: invoke", {"${W3C_ELEMENT_KEY}": el3[1].id})`);
      expect(python).toContain('# Verify: el4 text = "Welcome"');

      const java = generate(JavaJUnit5Framework, actions);
      expect(java).toContain('((org.openqa.selenium.remote.RemoteWebElement) el3.get(1)).getId()');

      const wdio = generate(JsWdIoFramework, actions);
      expect(wdio).toContain('el3[1].elementId');
      expect(wdio).not.toContain(ELEMENT_REF_PREFIX);
    });

    it('keeps the recorded id with a comment in languages without an id expression', function () {
      const code = generate(DotNetNUnitFramework, loginSession().toInspectorActions());
      expect(code).toContain('// Replace "b1" with the element id of el3[1]');
      expect(code).toContain('"b1"');
      expect(code).not.toContain(ELEMENT_REF_PREFIX);
    });

    it('flags brittle locators', function () {
      const rec = new SessionRecording('s1');
      rec.recordCommand('findElement', ['xpath', '/Window/Pane[2]/Button'], ref('x'));
      rec.recordCommand('click', ['x'], null);
      expect(rec.toInspectorActions()[0]).toEqual({
        action: 'comment',
        params: ['Brittle locator for el1: absolute xpath, positional index'],
      });
    });
  });

  describe('outputs', function () {
    it('writes a locators.md line per step', function () {
      const md = loginSession().toLocatorsMarkdown();
      expect(md).toContain('1 | CLICK | accessibility id: UserName');
      expect(md).toContain(`3 | TYPE | accessibility id: Password | "${PASSWORD_PLACEHOLDER}"`);
      expect(md).toContain('4 | EXECUTE | windows: invoke | xpath: //Button (item 1 of the matches)');
    });

    it('saves steps.json, actions.json and locators.md', async function () {
      const dir = await mkdtemp(path.join(os.tmpdir(), 'recorder-'));
      try {
        const out = await loginSession().save(dir);
        const steps = JSON.parse(await readFile(path.join(out, 'steps.json'), 'utf8'));
        expect(steps.steps).toHaveLength(5);
        expect(JSON.parse(await readFile(path.join(out, 'actions.json'), 'utf8')).length).toBeGreaterThan(5);
        expect(await readFile(path.join(out, 'locators.md'), 'utf8')).toContain('CLICK');
      } finally {
        await rm(dir, {recursive: true, force: true});
      }
    });
  });

  describe('RecordingStore', function () {
    it('keeps only the most recent finished recordings', function () {
      const store = new RecordingStore(2);
      for (const id of ['a', 'b', 'c']) {
        store.getOrCreate(id);
        store.finish(id);
      }
      store.getOrCreate('live');
      expect(store.list().map((r) => r.sessionId)).toEqual(['b', 'c', 'live']);
    });
  });

  it('reads settings from the environment', function () {
    expect(recorderSettings({APPIUM_RECORDER: 'off'}).enabled).toBe(false);
    expect(recorderSettings({APPIUM_RECORDER_DIR: 'X:/rec'})).toEqual({
      enabled: true,
      recordAll: false,
      outputDir: 'X:/rec',
      suggestLocators: true,
    });
    expect(recorderSettings({APPIUM_RECORDER: 'all'}).recordAll).toBe(true);
    expect(recorderSettings({APPIUM_RECORDER_LOCATORS: 'off'}).suggestLocators).toBe(false);
  });

  it('warns about generated-looking values', function () {
    expect(locatorWarnings('accessibility id', 'Button_123456')).toEqual(['value looks generated']);
    expect(locatorWarnings('accessibility id', 'LoginButton')).toEqual([]);
  });
});

describe('plugin recorder: pause and saved recordings', function () {
  it('skips steps while paused but keeps tracking locators', function () {
    const rec = new SessionRecording('s1');
    rec.paused = true;
    rec.recordCommand('findElement', ['name', 'OK'], ref('e1'));
    rec.recordCommand('click', ['e1'], null);
    rec.paused = false;
    rec.recordCommand('click', ['e1'], null);
    expect(rec.steps).toHaveLength(1);
    expect(rec.steps[0]).toMatchObject({n: 1, element: {selector: 'OK'}});
    expect(rec.summary()).toMatchObject({paused: false, steps: 1});
  });

  it('shows the app capability in the summary', function () {
    const rec = new SessionRecording('s1', {platformName: 'Windows', 'appium:app': 'notepad.exe'});
    expect(rec.summary()).toMatchObject({app: 'notepad.exe', platformName: 'Windows'});
  });

  it('lists and finds recordings saved by earlier server runs', async function () {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'recorder-'));
    try {
      const old = loginSession();
      old.startedAt = '2026-01-01T10:00:00.000Z';
      old.endedAt = '2026-01-01T10:05:00.000Z';
      await old.save(dir);

      const store = new RecordingStore();
      store.getOrCreate('live-1').recordCommand('keys', [['a']], null);
      const list = await store.listAll(dir);
      expect(list.map((r) => [r.sessionId, r.active, r.saved])).toEqual([
        ['live-1', true, false],
        ['abcdef12-3456', false, true],
      ]);

      const loaded = await store.find('abcdef12-3456', dir);
      expect(loaded.steps).toHaveLength(5);
      expect(loaded.toInspectorActions()).toEqual(old.toInspectorActions());
      expect(await store.find('missing', dir)).toBeUndefined();
    } finally {
      await rm(dir, {recursive: true, force: true});
    }
  });

  it('does not list a saved copy of a recording still in memory', async function () {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'recorder-'));
    try {
      const store = new RecordingStore();
      const rec = store.getOrCreate('s1');
      rec.recordCommand('keys', [['a']], null);
      store.finish('s1');
      await rec.save(dir);
      expect((await store.listAll(dir)).map((r) => r.sessionId)).toEqual(['s1']);
    } finally {
      await rm(dir, {recursive: true, force: true});
    }
  });
});

describe('server-recordings utils', function () {
  it('builds API urls at the server root', function () {
    expect(originOfServerUrl('http://10.0.0.1:4723/wd/hub')).toBe('http://10.0.0.1:4723');
    expect(originOfBuilderServer({hostname: 'host', port: 4724, ssl: true})).toBe('https://host:4724');
    expect(originOfBuilderServer({})).toBe('http://127.0.0.1:4723');
    expect(recordingsUrl('http://h:1', 'a b', '/pause')).toBe('http://h:1/inspector/api/recordings/a%20b/pause');
  });

  it('describes steps for the steps table', function () {
    const [click, , password, execute, read] = loginSession().steps;
    expect(describeStepTarget(click)).toBe('accessibility id: UserName');
    expect(describeStepValue(password)).toBe(PASSWORD_PLACEHOLDER);
    expect(describeStepTarget(execute)).toBe('windows: invoke → xpath: //Button (item 1)');
    expect(describeStepValue(read)).toBe('text = "Welcome"');
  });
});

describe('plugin recorder: deleting recordings', function () {
  const withDir = async (fn) => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'recorder-'));
    try {
      await fn(dir);
    } finally {
      await rm(dir, {recursive: true, force: true});
    }
  };
  const exists = async (p) => !!(await stat(p).catch(() => null));

  it('deletes a finished recording from memory and its folder from disk', async function () {
    await withDir(async (dir) => {
      const store = new RecordingStore();
      const rec = store.start('d1');
      rec.recordCommand('keys', [['a']], null);
      store.finish('d1');
      const folder = await rec.save(dir);

      const result = await store.delete('d1', dir);
      expect(result).toMatchObject({sessionId: 'd1', filesRemoved: true, folderRemoved: true});
      expect(await exists(folder)).toBe(false);
      expect(store.get('d1')).toBeUndefined();
      expect(await store.listAll(dir)).toEqual([]);
    });
  });

  it('deletes recordings saved by an earlier server run', async function () {
    await withDir(async (dir) => {
      const folder = await loginSession().save(dir);
      const result = await new RecordingStore().delete('abcdef12-3456', dir);
      expect(result.folderRemoved).toBe(true);
      expect(await exists(folder)).toBe(false);
    });
  });

  it('refuses to delete a running recording', async function () {
    await withDir(async (dir) => {
      const store = new RecordingStore();
      store.start('running');
      await expect(store.delete('running', dir)).rejects.toThrow('stop it before deleting');
      expect(store.get('running')).toBeDefined();
    });
  });

  it('removes only the recording files and keeps a folder that has other files', async function () {
    await withDir(async (dir) => {
      const folder = await loginSession().save(dir);
      await writeFile(path.join(folder, 'notes.txt'), 'mine');
      const result = await new RecordingStore().delete('abcdef12-3456', dir);
      expect(result).toMatchObject({filesRemoved: true, folderRemoved: false});
      expect(await exists(path.join(folder, 'notes.txt'))).toBe(true);
      expect(await exists(path.join(folder, 'steps.json'))).toBe(false);
    });
  });

  it('never touches files outside the recordings folder', async function () {
    await withDir(async (dir) => {
      const store = new RecordingStore();
      const rec = store.start('outside');
      store.finish('outside');
      rec.savedTo = path.join(dir, 'elsewhere', 'deeper');
      await expect(store.delete('outside', path.join(dir, 'recordings'))).rejects.toThrow(
        'outside the recordings folder',
      );
      expect(store.get('outside')).toBeDefined();
    });
  });

  it('returns null for an unknown recording', async function () {
    await withDir(async (dir) => {
      expect(await new RecordingStore().delete('nope', dir)).toBeNull();
    });
  });
});

describe('plugin recorder: scouting calls', function () {
  const scoutingSession = () => {
    const rec = new SessionRecording('scout');
    rec.recordCommand('execute', ['windows: getWindows', [{}]], [{handle: '0x1', title: 'Calculator'}]);
    rec.recordCommand('findElement', ['accessibility id', 'CalculatorResults'], ref('r1'));
    rec.recordCommand('execute', ['windows: getValue', [ref('r1')]], 'Display is 15');
    return rec;
  };

  it('keeps element-less reads in the recording with their result', function () {
    const [scout, check] = scoutingSession().steps;
    expect(scout).toMatchObject({action: 'read', scouting: true, script: 'windows: getWindows'});
    expect(scout.result).toContain('Calculator');
    expect(check.scouting).toBeUndefined(); // a read on an element is a real check
  });

  it('shows scouting calls commented out, without their output', function () {
    const actions = scoutingSession().toInspectorActions();
    const java = generate(JavaJUnit5Framework, actions);
    expect(java).toContain('// scouting call, not needed to replay:\n// driver.executeScript("windows: getWindows"');
    const python = generate(PythonFramework, actions);
    expect(python).toContain('# scouting call, not needed to replay:\n# driver.execute_script("windows: getWindows"');
    for (const code of [java, python]) {
      expect(code).not.toContain('0x1');
      expect(code).toContain('Verify: script windows: getValue = "Display is 15"');
    }
  });

  it('lists scouting calls briefly in locators.md', function () {
    const md = scoutingSession().toLocatorsMarkdown();
    expect(md).toContain('1 | READ | windows: getWindows | scouting call (result in steps.json)');
    expect(md).not.toContain('0x1');
  });
});
