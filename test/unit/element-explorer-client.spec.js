import {describe, expect, it, vi} from 'vitest';

import {
  analysisNodes,
  elementCandidates,
  explorerSelectionContext,
  isExplorerSelectionCurrent,
  nodePreviewRect,
} from '../../app/common/renderer/components/SessionInspector/SourceTab/ElementExplorer/element-explorer-view.js';
import {
  createElementAnalysisClient,
  ELEMENT_ANALYSIS_TYPES,
} from '../../app/common/renderer/embedded/element-explorer-client.js';
import {EMBEDDED_PROTOCOL_CHANNEL, EMBEDDED_PROTOCOL_VERSION} from '../../app/common/renderer/embedded/protocol.js';

const snapshot = {
  snapshotId: 'snapshot-1',
  targetNodeId: '0',
  sessionId: 'session-1',
  platform: 'android',
  context: 'NATIVE_APP',
  sourceXml: '<hierarchy/>',
  nodes: [
    {nodeId: '', parentId: null, tag: 'hierarchy', attributes: {}, candidates: []},
    {
      nodeId: '0',
      parentId: '',
      tag: 'Button',
      attributes: {text: 'Pagar'},
      candidates: [{id: 'id-pay', strategy: 'id', selector: 'pay'}],
    },
  ],
};

function setup() {
  let receive;
  let nextId = 0;
  const parentWindow = {postMessage: vi.fn()};
  const targetWindow = {
    addEventListener: vi.fn((_name, listener) => {
      receive = listener;
    }),
    removeEventListener: vi.fn(),
  };
  const onUpdate = vi.fn();
  const client = createElementAnalysisClient({
    targetWindow,
    parentWindow,
    hostOrigin: 'appium-recorder://host',
    onUpdate,
    makeId: () => 'request-' + ++nextId,
  });
  function deliver(payload, overrides = {}) {
    receive({
      source: parentWindow,
      origin: 'appium-recorder://host',
      data: {
        channel: EMBEDDED_PROTOCOL_CHANNEL,
        version: EMBEDDED_PROTOCOL_VERSION,
        type: ELEMENT_ANALYSIS_TYPES.UPDATE,
        payload: {
          requestId: 'request-1',
          snapshotId: 'snapshot-1',
          status: 'running',
          phase: 'Analizando',
          processed: 1,
          total: 1,
          ...payload,
        },
      },
      ...overrides,
    });
  }
  return {client, onUpdate, parentWindow, targetWindow, deliver};
}

describe('element explorer analysis lifecycle', () => {
  it('sends all nodes, including the root, through the existing restricted bridge', () => {
    const app = setup();
    expect(app.client.start(snapshot)).toBe('request-1');
    expect(app.parentWindow.postMessage).toHaveBeenCalledWith(
      {
        channel: EMBEDDED_PROTOCOL_CHANNEL,
        version: 3,
        type: ELEMENT_ANALYSIS_TYPES.REQUEST,
        payload: {...snapshot, requestId: 'request-1'},
      },
      'appium-recorder://host',
    );
    app.client.dispose();
  });

  it('ignores other frames, origins, requests and captures', () => {
    const app = setup();
    app.client.start(snapshot);
    app.deliver({}, {source: {}});
    app.deliver({}, {origin: 'https://untrusted.example'});
    app.deliver({requestId: 'other'});
    app.deliver({snapshotId: 'other'});
    app.deliver({targetNodeId: ''});
    expect(app.onUpdate).not.toHaveBeenCalled();
    app.deliver({});
    expect(app.onUpdate).toHaveBeenCalledOnce();
    app.client.dispose();
  });

  it('only accepts results for the requested node, including an explicitly selected root', () => {
    const app = setup();
    app.client.start(snapshot);
    const root = {nodeId: '', suggestedName: 'Pantalla', recommendedCandidateId: null, reason: 'Contenedor'};
    const known = {nodeId: '0', suggestedName: 'Pagar', recommendedCandidateId: 'id-pay', reason: 'Identificador'};
    app.deliver({
      results: [root, known, {...known, nodeId: 'invented'}, {...known, recommendedCandidateId: 'invented'}],
    });
    expect(app.onUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        results: [{...known, proposals: [], warnings: []}],
      }),
    );
    app.client.start({...snapshot, targetNodeId: ''});
    app.deliver({requestId: 'request-2', targetNodeId: '', results: [known, root]});
    expect(app.onUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        results: [{...root, proposals: [], warnings: []}],
      }),
    );
    app.client.dispose();
  });

  it('requires a real selected node before starting, regardless of its interaction type', () => {
    const app = setup();
    expect(() => app.client.start({...snapshot, targetNodeId: undefined})).toThrow('Selecciona un elemento');
    expect(() => app.client.start({...snapshot, targetNodeId: 'unknown'})).toThrow('Selecciona un elemento');
    expect(app.parentWindow.postMessage).not.toHaveBeenCalled();
    app.client.start({...snapshot, nodes: snapshot.nodes.map((node) => ({...node, tag: 'TextView'}))});
    expect(app.parentWindow.postMessage).toHaveBeenCalledOnce();
    app.client.dispose();
  });

  it('validates proposal shapes and accepts their contracts without accepting another target', () => {
    const app = setup();
    app.client.start(snapshot);
    const proposal = {
      id: 'agent-1',
      strategy: 'xpath',
      selector: '//*[@text="Pagar"]',
      reason: 'Texto observado',
      xpathStrategy: 'Atributos del elemento',
      unique: true,
      structural: false,
    };
    const contract = {
      nodeId: '0',
      candidateId: 'agent-1',
      compatible: true,
      locatorType: 'XPATH',
      locatorValue: proposal.selector,
    };
    app.deliver({
      results: [
        {
          nodeId: '0',
          suggestedName: 'payButton',
          recommendedCandidateId: 'id-pay',
          reason: 'Objetivo',
          proposals: [
            proposal,
            {...proposal, id: 'id-pay'},
            {...proposal, id: 'bad-unique', unique: 'true'},
            {...proposal, id: 'bad-empty', selector: ''},
            proposal,
          ],
          warnings: ['No reemplaza verificación Appium', null, 8],
        },
      ],
      locatorContracts: [contract, {...contract, nodeId: ''}],
    });
    expect(app.onUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        results: [expect.objectContaining({proposals: [proposal], warnings: ['No reemplaza verificación Appium']})],
        locatorContracts: [contract],
      }),
    );
    app.deliver({status: 'completed', locatorContracts: [contract]});
    expect(app.onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({locatorContracts: [contract]}));
    app.client.dispose();
  });

  it('changing the target cancels the old request and rejects its late proposals', () => {
    const app = setup();
    app.client.start(snapshot);
    app.client.start({...snapshot, targetNodeId: ''});
    app.deliver({
      status: 'completed',
      results: [{nodeId: '0', suggestedName: 'old', recommendedCandidateId: null, reason: 'old'}],
    });
    app.deliver({requestId: 'request-2', targetNodeId: '0'});
    expect(app.onUpdate).not.toHaveBeenCalled();
    app.deliver({requestId: 'request-2', targetNodeId: '', status: 'completed'});
    expect(app.onUpdate).toHaveBeenCalledOnce();
    app.client.dispose();
  });

  it('cancels the current request before retry and ignores late answers from the earlier one', () => {
    const app = setup();
    app.client.start(snapshot);
    app.client.start(snapshot);
    expect(app.parentWindow.postMessage.mock.calls[1][0]).toMatchObject({
      type: ELEMENT_ANALYSIS_TYPES.CANCEL,
      payload: {requestId: 'request-1', snapshotId: 'snapshot-1'},
    });
    app.deliver({status: 'completed'});
    expect(app.onUpdate).not.toHaveBeenCalled();
    app.deliver({requestId: 'request-2', status: 'completed', processed: 1, total: 1});
    expect(app.onUpdate).toHaveBeenCalledOnce();
    app.deliver({requestId: 'request-2'});
    expect(app.onUpdate).toHaveBeenCalledOnce();
    app.client.dispose();
  });

  it('removes its listener and ignores answers after closing', () => {
    const app = setup();
    app.client.start(snapshot);
    app.client.dispose();
    app.deliver({status: 'completed'});
    expect(app.onUpdate).not.toHaveBeenCalled();
    expect(app.targetWindow.removeEventListener).toHaveBeenCalledOnce();
    expect(() => app.client.start(snapshot)).toThrow('El explorador ya está cerrado');
  });
});

describe('screenshot node highlight', () => {
  it('maps Android bounds and iOS coordinates to the captured viewport', () => {
    expect(nodePreviewRect({attributes: {bounds: '[10,20][40,60]'}}, {width: 100, height: 100})).toEqual({
      left: '10%',
      top: '20%',
      width: '30%',
      height: '40%',
    });
    expect(
      nodePreviewRect({attributes: {x: '10', y: '20', width: '30', height: '40'}}, {width: 100, height: 100}),
    ).toEqual({left: '10%', top: '20%', width: '30%', height: '40%'});
    expect(nodePreviewRect({attributes: {}}, {width: 100, height: 100})).toBeNull();
  });
});

describe('selected element candidates and initial Inspector selection', () => {
  it('captures the exact Inspector selection including the empty XML root', () => {
    const props = {
      selectedElement: {path: ''},
      sourceXML: '<hierarchy/>',
      sourceJSON: {},
      currentContext: 'NATIVE_APP',
      driver: {sessionId: 'one'},
      featureCaps: {platformName: 'android', automationName: 'uiautomator2'},
    };
    const capture = explorerSelectionContext(props);
    expect(capture.targetNodeId).toBe('');
    expect(capture.platform).toBe('android');
    expect(capture.automationName).toBe('uiautomator2');
    expect(isExplorerSelectionCurrent(capture, explorerSelectionContext(props))).toBe(true);
    for (const changed of [
      {...props, selectedElement: {path: '0'}},
      {...props, selectedElement: undefined},
      {...props, sourceXML: '<hierarchy><View/></hierarchy>'},
      {...props, sourceJSON: {}},
      {...props, sourceError: true},
      {...props, driver: {sessionId: 'two'}},
      {...props, currentContext: 'WEBVIEW'},
      {...props, featureCaps: {...props.featureCaps, platformName: 'ios'}},
      {...props, featureCaps: {...props.featureCaps, automationName: 'xcuitest'}},
    ]) {
      expect(isExplorerSelectionCurrent(capture, explorerSelectionContext(changed))).toBe(false);
    }
  });

  it('uses finalized feature capabilities instead of stale requested session capabilities', () => {
    const capture = explorerSelectionContext({
      featureCaps: {platformName: 'ios', automationName: 'xcuitest'},
      sessionCaps: {platformName: 'Android'},
      automationName: 'uiautomator2',
      driver: {sessionId: 'one', capabilities: {platformName: 'Android'}},
    });
    expect(capture.platform).toBe('ios');
    expect(capture.automationName).toBe('xcuitest');
  });

  it('uses the active driver platform before feature capabilities are available', () => {
    const capture = explorerSelectionContext({
      driver: {sessionId: 'one', capabilities: {platformName: 'Android'}},
    });
    expect(capture.platform).toBe('android');
    expect(capture.automationName).toBeUndefined();
  });

  it('retains all XML context and strategy labels in the analysis request', () => {
    const catalog = {
      nodes: snapshot.nodes.map((node) => ({
        ...node,
        candidates: node.candidates.map((candidate) => ({...candidate, xpathStrategy: 'Padre'})),
      })),
    };
    expect(analysisNodes(catalog).map(({nodeId}) => nodeId)).toEqual(['', '0']);
    expect(analysisNodes(catalog)[1].candidates[0].xpathStrategy).toBe('Padre');
  });

  it('merges new proposals without replacing or duplicating local selector pairs', () => {
    const proposals = [
      {id: 'agent-same', strategy: 'id', selector: 'pay', reason: 'Same selector', unique: true, structural: false},
      {
        id: 'agent-new',
        strategy: 'xpath',
        selector: '//*[@text="Pagar"]',
        reason: 'Visible text',
        unique: true,
        structural: false,
      },
      {
        id: 'agent-new-duplicate',
        strategy: 'xpath',
        selector: '//*[@text="Pagar"]',
        reason: 'Duplicate pair',
        unique: true,
        structural: false,
      },
      {
        id: 'id-pay',
        strategy: 'xpath',
        selector: '//invented',
        reason: 'Conflicting ID',
        unique: true,
        structural: false,
      },
    ];
    const result = elementCandidates(snapshot.nodes[1], proposals);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({id: 'id-pay', selector: 'pay', origin: 'local'});
    expect(result[1]).toMatchObject({id: 'agent-new', origin: 'agent', stability: 'contextual'});
    expect(result[1]).not.toHaveProperty('sameElement');
    expect(result[1]).not.toHaveProperty('matchCount');
    expect(elementCandidates(snapshot.nodes[1])).toHaveLength(1);
  });
});

describe('locator fallback ordering', () => {
  it('keeps structural candidates after context proposals without changing their contents', () => {
    const fallback = {id: 'position', strategy: 'xpath', selector: '/hierarchy/View[1]', structural: true};
    const local = {id: 'id', strategy: 'id', selector: 'pay', structural: false};
    const proposal = {id: 'context', strategy: 'xpath', selector: '//View[@text="Pagar"]', structural: false};
    const result = elementCandidates({candidates: [local, fallback]}, [proposal]);
    expect(result.map(({id}) => id)).toEqual(['id', 'context', 'position']);
    expect(result[2]).toMatchObject(fallback);
  });
});
