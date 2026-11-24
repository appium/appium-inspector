import {describe, expect, it} from 'vitest';

import {canStartRecording} from '../../app/common/renderer/utils/server-recordings.js';
import {xmlToJSON} from '../../app/common/renderer/utils/source-parsing.js';
import {AppiumInspectorPlugin} from '../../plugins/index.mjs';
import {findNodeForElement, needsUpgrade, suggestLocator} from '../../plugins/locator-upgrade.mjs';
import {store, W3C_ELEMENT_KEY} from '../../plugins/recorder.mjs';

const XML =
  '<Window Name="Crm" AutomationId="Main">' +
  '<Pane>' +
  '<Button Name="OK" AutomationId="btnSave" ClassName="Button" x="10" y="10" width="80" height="20"/>' +
  '<Button Name="OK" AutomationId="" ClassName="Button" x="100" y="10" width="80" height="20"/>' +
  '<Edit Name="Search" ClassName="TextBox" x="10" y="40" width="200" height="20"/>' +
  '</Pane>' +
  '</Window>';

// attributes and rect the fake driver reports for each live element
const LIVE = {
  save: {attrs: {Name: 'OK', AutomationId: 'btnSave', ClassName: 'Button', ControlType: 'ControlType.Button'}},
  ok2: {
    attrs: {Name: 'OK', ClassName: 'Button', ControlType: 'ControlType.Button'},
    rect: {x: 100, y: 10, width: 80, height: 20},
  },
  search: {attrs: {Name: 'Search', ClassName: 'TextBox', ControlType: 'ControlType.Edit'}},
};

function fakeDriver(sessionId) {
  const calls = {getPageSource: 0};
  return {
    calls,
    sessionId,
    caps: {platformName: 'Windows', automationName: 'Wincore'},
    async getAttribute(name, id) {
      const value = LIVE[id]?.attrs[name];
      if (value === undefined) {
        throw new Error('unsupported attribute');
      }
      return value;
    },
    async getElementRect(id) {
      return LIVE[id]?.rect ?? null;
    },
    async getPageSource() {
      calls.getPageSource++;
      return XML;
    },
  };
}

describe('plugin locator upgrade', function () {
  it('treats only accessibility id as strong', function () {
    expect(needsUpgrade({strategy: 'accessibility id'})).toBe(false);
    expect(needsUpgrade({strategy: 'xpath'})).toBe(true);
    expect(needsUpgrade({strategy: null})).toBe(true);
  });

  it('finds the node of a live element by attributes, and by rect when attributes are not enough', function () {
    const root = xmlToJSON(XML);
    expect(findNodeForElement(root, {attributes: LIVE.save.attrs}).attributes.AutomationId).toBe('btnSave');
    expect(findNodeForElement(root, {attributes: LIVE.ok2.attrs, rect: LIVE.ok2.rect}).attributes.x).toBe('100');
    // two "OK" buttons and no rect: refuse to guess
    expect(findNodeForElement(root, {attributes: {Name: 'OK', ControlType: 'Button'}})).toBeNull();
  });

  it('prefers a unique AutomationId and never suggests id on Windows', function () {
    const root = xmlToJSON(XML);
    const save = findNodeForElement(root, {attributes: LIVE.save.attrs});
    expect(suggestLocator(XML, save, 'Wincore')).toMatchObject({strategy: 'accessibility id', selector: 'btnSave'});
    const search = findNodeForElement(root, {attributes: LIVE.search.attrs});
    expect(suggestLocator(XML, search, 'wincore')).toMatchObject({strategy: 'name', selector: 'Search'});
  });

  it('upgrades weak locators in the plugin before the first action, reading the source once', async function () {
    const plugin = new AppiumInspectorPlugin('inspector', {});
    plugin.recorder.recordAll = true;
    const driver = fakeDriver('upgrade-test');
    const run = (cmd, result, ...args) => plugin.handle(async () => result, driver, cmd, ...args);

    await run('findElement', {[W3C_ELEMENT_KEY]: 'save'}, 'xpath', '/Window/Pane/Button[1]');
    await run('click', null, 'save');
    await run('click', null, 'save'); // already upgraded: no new source read
    await run('findElement', {[W3C_ELEMENT_KEY]: 'search'}, 'xpath', '//Edit');
    await run('getText', 'abc', 'search'); // read-only: the source is reused
    expect(driver.calls.getPageSource).toBe(2); // second read after the click changed the state

    const rec = store.get('upgrade-test');
    expect(rec.steps[0].element.suggested).toMatchObject({strategy: 'accessibility id', selector: 'btnSave'});
    const actions = rec.toInspectorActions();
    expect(actions).toContainEqual({action: 'findAndAssign', params: ['accessibility id', 'btnSave', 'el1', false]});
    expect(actions).toContainEqual({action: 'findAndAssign', params: ['name', 'Search', 'el2', false]});
    expect(actions.find((a) => a.action === 'comment').params[0]).toContain(
      'Recorded locator for el1 was xpath: /Window/Pane/Button[1]',
    );
    expect(rec.toLocatorsMarkdown()).toContain('accessibility id: btnSave  (suggested; recorded: xpath:');
  });

  it('keeps strong locators without reading the page source', async function () {
    const plugin = new AppiumInspectorPlugin('inspector', {});
    plugin.recorder.recordAll = true;
    const driver = fakeDriver('strong-test');
    await plugin.handle(
      async () => ({[W3C_ELEMENT_KEY]: 'save'}),
      driver,
      'findElement',
      'accessibility id',
      'btnSave',
    );
    await plugin.handle(async () => null, driver, 'click', 'save');
    expect(driver.calls.getPageSource).toBe(0);
    expect(store.get('strong-test').steps[0].element.suggested).toBeUndefined();
  });
});

describe('plugin session end', function () {
  it('finishes the recording when the umbrella driver handles deleteSession', async function () {
    const plugin = new AppiumInspectorPlugin('inspector', {});
    plugin.recorder.recordAll = true;
    plugin.recorder.outputDir = `${process.env.TEMP ?? '/tmp'}/recorder-delete-test`;
    const driver = fakeDriver('delete-test');
    await plugin.handle(async () => null, driver, 'keys', ['a']);
    // Appium's umbrella driver: no sessionId of its own, the id comes as the argument
    await plugin.handle(async () => null, {caps: {}}, 'deleteSession', 'delete-test');
    expect(store.get('delete-test').active).toBe(false);
  });
});

describe('plugin recording control', function () {
  const find = (id) => async () => ({[W3C_ELEMENT_KEY]: id});

  it('does not record sessions by default, only lists them as idle', async function () {
    const plugin = new AppiumInspectorPlugin('inspector', {});
    const driver = fakeDriver('idle-test');
    await plugin.handle(find('save'), driver, 'findElement', 'xpath', '//Button');
    await plugin.handle(async () => null, driver, 'click', 'save');
    expect(store.get('idle-test')).toBeUndefined();
    expect(driver.calls.getPageSource).toBe(0);
    expect(store.idleSessions().map((s) => [s.sessionId, s.state])).toContainEqual(['idle-test', 'idle']);
  });

  it('is controlled with inspector: execute scripts, which are not recorded themselves', async function () {
    const plugin = new AppiumInspectorPlugin('inspector', {});
    plugin.recorder.outputDir = `${process.env.TEMP ?? '/tmp'}/recorder-control-test`;
    const driver = fakeDriver('control-test');
    const exec = (script, args = [{}], result = null) => plugin.execute(async () => result, driver, script, args);

    await plugin.handle(find('save'), driver, 'findElement', 'accessibility id', 'btnSave');
    await expect(exec('inspector: getRecording')).rejects.toThrow('not being recorded');

    expect((await exec('inspector: startRecording')).state).toBe('recording');
    await plugin.handle(async () => null, driver, 'click', 'save');
    await exec('windows: invoke', [{[W3C_ELEMENT_KEY]: 'save'}]);
    await exec('inspector: pauseRecording');
    await plugin.handle(async () => null, driver, 'click', 'save'); // paused: not recorded
    await exec('inspector: resumeRecording');

    const out = await exec('inspector: getRecording', [{format: 'python'}]);
    expect(out).toMatchObject({state: 'recording', steps: 2, format: 'python', language: 'Python'});
    expect(out.code).toContain('el1 = driver.find_element(by=AppiumBy.ACCESSIBILITY_ID, value="btnSave")');
    expect(out.code).toContain('driver.execute_script("windows: invoke"');
    expect(out.code).not.toContain('inspector:');
    expect(out.locatorsMd).toContain('2 | EXECUTE | windows: invoke');

    const stopped = await exec('inspector: stopRecording');
    expect(stopped.state).toBe('finished');
    expect(stopped.savedTo).toContain('recorder-control-test');
    // a stopped recording is final: it is not continued, and its session is not offered again
    await expect(exec('inspector: startRecording')).rejects.toThrow('is finished and cannot be continued');
    expect(store.idleSessions().map((s) => s.sessionId)).not.toContain('control-test');
    // commands after the stop are not recorded
    await plugin.handle(async () => null, driver, 'click', 'save');
    expect(store.get('control-test').steps).toHaveLength(2);
  });

  it('starts with the session when the inspectorRecord capability is set', async function () {
    const plugin = new AppiumInspectorPlugin('inspector', {});
    const driver = {...fakeDriver('cap-test'), caps: {automationName: 'Wincore', inspectorRecord: true}};
    await plugin.handle(find('save'), driver, 'findElement', 'accessibility id', 'btnSave');
    await plugin.handle(async () => null, driver, 'click', 'save');
    expect(store.get('cap-test').steps).toHaveLength(1);
  });

  it('keeps tracking finds while paused, so later steps keep their locators', async function () {
    const plugin = new AppiumInspectorPlugin('inspector', {});
    const driver = fakeDriver('pause-find-test');
    const exec = (script) => plugin.execute(async () => null, driver, script, [{}]);

    await exec('inspector: startRecording');
    await exec('inspector: pauseRecording');
    await plugin.handle(find('save'), driver, 'findElement', 'accessibility id', 'btnSave');
    await plugin.handle(async () => null, driver, 'click', 'save'); // paused: not recorded
    await exec('inspector: resumeRecording');
    await plugin.handle(async () => null, driver, 'click', 'save');

    const {steps} = store.get('pause-find-test');
    expect(steps).toHaveLength(1);
    expect(steps[0].element).toMatchObject({strategy: 'accessibility id', selector: 'btnSave'});
  });

  it('reads the page source again when a command changed the app while paused', async function () {
    const plugin = new AppiumInspectorPlugin('inspector', {});
    const driver = fakeDriver('pause-source-test');
    const exec = (script) => plugin.execute(async () => null, driver, script, [{}]);

    await exec('inspector: startRecording');
    await plugin.handle(find('search'), driver, 'findElement', 'xpath', '//Edit');
    await plugin.handle(async () => XML, driver, 'getPageSource'); // the client read it: cached
    await exec('inspector: pauseRecording');
    await plugin.handle(async () => null, driver, 'click', 'save'); // may change the app
    await exec('inspector: resumeRecording');
    await plugin.handle(async () => 'abc', driver, 'getText', 'search');

    expect(driver.calls.getPageSource).toBe(1); // not the copy read before the click
  });

  it('masks text typed into iOS secure text fields', async function () {
    const plugin = new AppiumInspectorPlugin('inspector', {});
    plugin.recorder.suggestLocators = false;
    const driver = {
      sessionId: 'ios-secret-test',
      caps: {platformName: 'iOS', automationName: 'XCUITest', inspectorRecord: true},
      async getAttribute(name) {
        if (name !== 'type') {
          throw new Error('unsupported attribute');
        }
        return 'XCUIElementTypeSecureTextField';
      },
    };
    await plugin.handle(find('pwd'), driver, 'findElement', 'accessibility id', 'password');
    await plugin.handle(async () => null, driver, 'setValue', 'hunter2', 'pwd');

    const [step] = store.get('ios-secret-test').steps;
    expect(step).toMatchObject({action: 'type', value: '{{PASSWORD}}', secret: true});
    expect(JSON.stringify(store.get('ios-secret-test').toJSON())).not.toContain('hunter2');
  });

  it('rejects unknown code formats with the list of supported ones', async function () {
    const plugin = new AppiumInspectorPlugin('inspector', {});
    const driver = fakeDriver('format-test');
    await plugin.execute(async () => null, driver, 'inspector: startRecording', [{}]);
    await expect(
      plugin.execute(async () => null, driver, 'inspector: getRecording', [{format: 'cobol'}]),
    ).rejects.toThrow(/Unknown code format 'cobol'.*python/);
  });
});

describe('plugin recording: session liveness', function () {
  it('offers recording again only while the Appium session is alive', async function () {
    const plugin = new AppiumInspectorPlugin('inspector', {});
    plugin.recorder.outputDir = `${process.env.TEMP ?? '/tmp'}/recorder-live-test`;
    const driver = fakeDriver('live-test');
    const exec = (script) => plugin.execute(async () => null, driver, script, [{}]);

    await exec('inspector: startRecording');
    await plugin.handle(async () => null, driver, 'keys', ['a']);
    const stopped = await exec('inspector: stopRecording');
    expect(stopped).toMatchObject({state: 'finished', sessionLive: true});
    expect(canStartRecording(stopped)).toBe(false); // final, even while the session lives
    expect(canStartRecording({state: 'idle', sessionLive: true})).toBe(true);

    await plugin.handle(async () => null, {caps: {}}, 'deleteSession', 'live-test');
    const ended = store.get('live-test').summary();
    expect(ended).toMatchObject({state: 'finished', sessionLive: false});
    expect(canStartRecording(ended)).toBe(false);
    expect(store.idleSessions().map((s) => s.sessionId)).not.toContain('live-test');
  });

  it('shows recordings read back from disk as finished, never live', async function () {
    const {SessionRecording} = await import('../../plugins/recorder.mjs');
    const rec = SessionRecording.fromSaved({meta: {sessionId: 'old'}, steps: []}, 'X:/rec/old');
    expect(rec.summary()).toMatchObject({state: 'finished', sessionLive: false, saved: true});
  });
});
