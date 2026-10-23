import {
  EMBEDDED_PROTOCOL_CHANNEL,
  EMBEDDED_PROTOCOL_VERSION,
  createEmbeddedBridge,
  resolveHostOrigin,
} from './protocol.js';

export const ELEMENT_ANALYSIS_TYPES = {
  REQUEST: 'appium-inspector:analyze-elements',
  CANCEL: 'appium-inspector:cancel-element-analysis',
  UPDATE: 'appium-inspector:element-analysis-update',
};

const statuses = new Set(['running', 'completed', 'cancelled', 'error']);

/** One analysis per open explorer. Never accept messages from another frame or capture. */
export function createElementAnalysisClient({
  targetWindow = window,
  parentWindow = targetWindow.parent,
  hostOrigin = resolveHostOrigin(targetWindow.location.href, import.meta.env.VITE_EMBEDDED_HOST_ORIGIN),
  onUpdate,
  makeId = () => crypto.randomUUID(),
}) {
  const bridge = createEmbeddedBridge(parentWindow, hostOrigin);
  let active = null;
  let disposed = false;

  const onMessage = (event) => {
    if (disposed || !active || event.source !== parentWindow || event.origin !== hostOrigin) {
      return;
    }
    const message = event.data;
    if (
      message?.channel !== EMBEDDED_PROTOCOL_CHANNEL ||
      message.version !== EMBEDDED_PROTOCOL_VERSION ||
      message.type !== ELEMENT_ANALYSIS_TYPES.UPDATE
    ) {
      return;
    }
    const payload = message.payload;
    if (
      !payload ||
      payload.requestId !== active.requestId ||
      payload.snapshotId !== active.snapshotId ||
      (payload.targetNodeId !== undefined && payload.targetNodeId !== active.targetNodeId) ||
      !statuses.has(payload.status) ||
      typeof payload.phase !== 'string' ||
      !Number.isInteger(payload.processed) ||
      payload.processed < 0 ||
      !Number.isInteger(payload.total) ||
      payload.total < payload.processed
    ) {
      return;
    }
    const results = [];
    for (const result of Array.isArray(payload.results) ? payload.results : []) {
      if (
        result?.nodeId !== active.targetNodeId ||
        typeof result.suggestedName !== 'string' ||
        typeof result.reason !== 'string'
      ) {
        continue;
      }
      const candidates = active.nodes.get(active.targetNodeId);
      const proposals = [];
      const seen = new Set();
      for (const proposal of Array.isArray(result.proposals) ? result.proposals : []) {
        if (
          !proposal ||
          typeof proposal.id !== 'string' ||
          !proposal.id.trim() ||
          typeof proposal.strategy !== 'string' ||
          !proposal.strategy.trim() ||
          typeof proposal.selector !== 'string' ||
          !proposal.selector.trim() ||
          typeof proposal.reason !== 'string' ||
          (proposal.xpathStrategy !== undefined && typeof proposal.xpathStrategy !== 'string') ||
          ![true, false, null].includes(proposal.unique) ||
          typeof proposal.structural !== 'boolean' ||
          active.localCandidateIds.has(proposal.id) ||
          seen.has(proposal.id)
        ) {
          continue;
        }
        seen.add(proposal.id);
        proposals.push({
          id: proposal.id,
          strategy: proposal.strategy,
          selector: proposal.selector,
          reason: proposal.reason,
          unique: proposal.unique,
          structural: proposal.structural,
          ...(typeof proposal.xpathStrategy === 'string' ? {xpathStrategy: proposal.xpathStrategy} : {}),
        });
      }
      const acceptedIds = new Set([...candidates, ...proposals.map(({id}) => id)]);
      if (result.recommendedCandidateId != null && !acceptedIds.has(result.recommendedCandidateId)) {
        continue;
      }
      for (const {id} of proposals) {
        candidates.add(id);
      }
      results.push({
        nodeId: result.nodeId,
        suggestedName: result.suggestedName,
        recommendedCandidateId: result.recommendedCandidateId ?? null,
        reason: result.reason,
        proposals,
        warnings: Array.isArray(result.warnings)
          ? result.warnings.filter((warning) => typeof warning === 'string')
          : [],
      });
    }
    const locatorContracts = Array.isArray(payload.locatorContracts)
      ? payload.locatorContracts.filter((entry) => {
          const candidates = active.nodes.get(entry?.nodeId);
          return (
            entry?.nodeId === active.targetNodeId &&
            candidates?.has(entry.candidateId) &&
            typeof entry.compatible === 'boolean' &&
            (entry.locatorType === undefined || typeof entry.locatorType === 'string') &&
            (entry.locatorValue === undefined || typeof entry.locatorValue === 'string') &&
            (entry.reason === undefined || typeof entry.reason === 'string')
          );
        })
      : undefined;
    onUpdate({...payload, results, ...(locatorContracts ? {locatorContracts} : {})});
    if (payload.status !== 'running') {
      active = null;
    }
  };

  targetWindow.addEventListener('message', onMessage);

  function cancel() {
    if (!active) {
      return;
    }
    const {requestId, snapshotId} = active;
    active = null;
    bridge.post(ELEMENT_ANALYSIS_TYPES.CANCEL, {requestId, snapshotId});
  }

  return {
    start(snapshot) {
      if (disposed) {
        throw new Error('El explorador ya está cerrado');
      }
      const target = snapshot.nodes.find((node) => node.nodeId === snapshot.targetNodeId);
      if (typeof snapshot.targetNodeId !== 'string' || !target) {
        throw new Error('Selecciona un elemento del árbol antes de analizarlo.');
      }
      cancel();
      const requestId = makeId();
      active = {
        requestId,
        snapshotId: snapshot.snapshotId,
        targetNodeId: snapshot.targetNodeId,
        localCandidateIds: new Set(target.candidates.map(({id}) => id)),
        nodes: new Map(snapshot.nodes.map((node) => [node.nodeId, new Set(node.candidates.map(({id}) => id))])),
      };
      try {
        bridge.post(ELEMENT_ANALYSIS_TYPES.REQUEST, {...snapshot, requestId});
      } catch (error) {
        active = null;
        throw error;
      }
      return requestId;
    },
    cancel,
    dispose() {
      cancel();
      disposed = true;
      targetWindow.removeEventListener('message', onMessage);
    },
  };
}
