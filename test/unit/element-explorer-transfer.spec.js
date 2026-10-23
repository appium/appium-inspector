import {afterEach, describe, expect, it, vi} from 'vitest';

vi.hoisted(() => {
  globalThis.localStorage = {getItem: vi.fn(() => null), setItem: vi.fn(), removeItem: vi.fn()};
});

import {verifyExplorerLocator} from '../../app/common/renderer/actions/SessionInspector.js';
import {createEmbeddedBridge, setEmbeddedBridge} from '../../app/common/renderer/embedded/protocol.js';
import InspectorDriver from '../../app/common/renderer/lib/appium/inspector-driver.js';

const node = {nodeId: '0', tag: 'Button', referenceSelector: '/*[1]/*[1]', attributes: {text: 'Pagar'}};
const candidate = {id: 'id-pay', strategy: 'id', selector: 'pay', unique: true, stability: 'stable'};
function setup() {
  const postMessage = vi.fn();
  setEmbeddedBridge(createEmbeddedBridge({postMessage}, 'appium-recorder://host'));
  const state = {
    inspector: {
      driver: {
        sessionId: 'session-1',
        getAppiumContext: vi.fn().mockResolvedValue('NATIVE_APP'),
        getPageSource: vi.fn().mockResolvedValue('<hierarchy/>'),
      },
      isEmbeddedMode: true,
      sourceXML: '<hierarchy/>',
      sourceJSON: {},
      currentContext: 'NATIVE_APP',
    },
  };
  const snapshot = {sessionId: 'session-1', sourceXml: '<hierarchy/>', context: 'NATIVE_APP'};
  const run = vi.fn().mockResolvedValue({elements: [{id: 'chosen-element'}]});
  vi.spyOn(InspectorDriver, 'instance').mockReturnValue({run});
  const dispatch = vi.fn();
  const execute = (options = {}) => verifyExplorerLocator(node, candidate, snapshot, options)(dispatch, () => state);
  return {state, driver: state.inspector.driver, dispatch, run, postMessage, execute};
}
afterEach(() => {
  setEmbeddedBridge(null);
  vi.restoreAllMocks();
});

describe('explorer transfer through the existing element-used contract', () => {
  it('checks an independent reference before verifying a candidate and emits only on explicit use', async () => {
    const app = setup();
    await app.execute();
    expect(app.postMessage).not.toHaveBeenCalled();
    expect(app.run).toHaveBeenNthCalledWith(1, {
      strategy: 'xpath',
      selector: node.referenceSelector,
      fetchArray: true,
      skipRefresh: true,
    });
    const payload = await app.execute({transfer: true});
    expect(payload).toMatchObject({
      elementId: 'chosen-element',
      strategy: 'id',
      selector: 'pay',
      candidates: [{candidateId: 'id-pay', matchCount: 1, sameElement: true}],
    });
    expect(app.postMessage).toHaveBeenCalledOnce();
    expect(app.postMessage.mock.calls[0][0].type).toBe('appium-inspector:element-used');
    expect(app.driver.getPageSource).toHaveBeenCalledTimes(4);
    expect(app.driver.getAppiumContext).toHaveBeenCalledTimes(8);
    expect(app.dispatch).not.toHaveBeenCalled();
    expect(app.run.mock.calls.every(([params]) => params.fetchArray && params.skipRefresh)).toBe(true);
  });

  it('does not transfer a candidate that points to a different element', async () => {
    const app = setup();
    app.run.mockResolvedValueOnce({elements: [{id: 'reference'}]}).mockResolvedValueOnce({elements: [{id: 'other'}]});
    await expect(app.execute({transfer: true})).rejects.toMatchObject({code: 'DIFFERENT_ELEMENT'});
    expect(app.postMessage).not.toHaveBeenCalled();
  });

  it('rejects a newer source capture even if the XML text has not changed', async () => {
    const app = setup();
    app.run.mockImplementationOnce(async () => {
      app.state.inspector.sourceJSON = {};
      return {elements: [{id: 'chosen-element'}]};
    });
    await expect(app.execute({transfer: true})).rejects.toMatchObject({code: 'STALE_SNAPSHOT'});
    expect(app.postMessage).not.toHaveBeenCalled();
  });

  it('rejects closed or superseded selection operations', async () => {
    const app = setup();
    await expect(app.execute({transfer: true, isCurrent: () => false})).rejects.toMatchObject({code: 'STALE_SNAPSHOT'});
    expect(app.run).not.toHaveBeenCalled();
    expect(app.postMessage).not.toHaveBeenCalled();
  });

  it('rejects a new device element at the old structural path even while Redux keeps the old capture', async () => {
    const app = setup();
    const sourceCapture = app.state.inspector.sourceJSON;
    app.driver.getPageSource.mockResolvedValue('<hierarchy><Button text="Otro destinatario"/></hierarchy>');
    await expect(app.execute({transfer: true})).rejects.toMatchObject({code: 'STALE_SNAPSHOT'});
    expect(app.run).not.toHaveBeenCalled();
    expect(app.postMessage).not.toHaveBeenCalled();
    expect(app.state.inspector.sourceXML).toBe('<hierarchy/>');
    expect(app.state.inspector.sourceJSON).toBe(sourceCapture);
    expect(app.dispatch).not.toHaveBeenCalled();
  });

  it('rejects device source changes during lookup even if both selectors resolve the same element', async () => {
    const app = setup();
    app.driver.getPageSource
      .mockResolvedValueOnce('<hierarchy/>')
      .mockResolvedValueOnce('<hierarchy><Button text="Nuevo"/></hierarchy>');
    await expect(app.execute({transfer: true})).rejects.toMatchObject({code: 'STALE_SNAPSHOT'});
    expect(app.run).toHaveBeenCalledTimes(3);
    expect(app.postMessage).not.toHaveBeenCalled();
    expect(app.dispatch).not.toHaveBeenCalled();
  });

  it('rejects a changed live context before lookup while the cached context remains native', async () => {
    const app = setup();
    app.driver.getAppiumContext.mockResolvedValue('WEBVIEW_other');
    await expect(app.execute({transfer: true})).rejects.toMatchObject({code: 'STALE_SNAPSHOT'});
    expect(app.run).not.toHaveBeenCalled();
    expect(app.driver.getPageSource).not.toHaveBeenCalled();
    expect(app.postMessage).not.toHaveBeenCalled();
  });

  it('rejects a changed live context during the final source read', async () => {
    const app = setup();
    app.driver.getAppiumContext
      .mockResolvedValueOnce('NATIVE_APP')
      .mockResolvedValueOnce('NATIVE_APP')
      .mockResolvedValueOnce('NATIVE_APP')
      .mockResolvedValueOnce('WEBVIEW_other');
    await expect(app.execute({transfer: true})).rejects.toMatchObject({code: 'STALE_SNAPSHOT'});
    expect(app.run).toHaveBeenCalledTimes(3);
    expect(app.postMessage).not.toHaveBeenCalled();
  });

  it('stops if the session changes during a live source read', async () => {
    const app = setup();
    app.driver.getPageSource.mockImplementationOnce(async () => {
      app.state.inspector.driver = {sessionId: 'session-2'};
      return '<hierarchy/>';
    });
    await expect(app.execute({transfer: true})).rejects.toMatchObject({code: 'STALE_SNAPSHOT'});
    expect(app.run).not.toHaveBeenCalled();
    expect(app.postMessage).not.toHaveBeenCalled();
  });

  it('does not transfer when the live snapshot cannot be read', async () => {
    const app = setup();
    app.driver.getPageSource.mockRejectedValue(new Error('Appium disconnected'));
    await expect(app.execute({transfer: true})).rejects.toThrow('Appium disconnected');
    expect(app.run).not.toHaveBeenCalled();
    expect(app.postMessage).not.toHaveBeenCalled();
  });

  it('does not treat webview nodes as native locators', async () => {
    const app = setup();
    app.state.inspector.currentContext = 'WEBVIEW_example';
    await expect(app.execute({transfer: true})).rejects.toMatchObject({code: 'NOT_EMBEDDED_MODE'});
    expect(app.run).not.toHaveBeenCalled();
  });
});
