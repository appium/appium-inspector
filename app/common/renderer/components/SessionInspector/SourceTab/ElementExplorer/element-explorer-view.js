export function analysisNodes(catalog) {
  return catalog.nodes.map(({nodeId, parentId, tag, attributes, candidates}) => ({
    nodeId,
    parentId,
    tag,
    attributes,
    candidates: candidates.map(({id, strategy, selector, reason, unique, structural, xpathStrategy}) => ({
      id,
      strategy,
      selector,
      reason,
      unique,
      structural: Boolean(structural),
      ...(typeof xpathStrategy === 'string' ? {xpathStrategy} : {}),
    })),
  }));
}

/** Overlay in viewport percentages; absent/offscreen geometry never invents a rectangle. */
export function nodePreviewRect(node, viewport) {
  if (!node || !(viewport?.width > 0) || !(viewport?.height > 0)) {
    return null;
  }
  const attributes = node.attributes;
  const bounds = attributes.bounds?.match(/^\[(-?\d+),(-?\d+)\]\[(-?\d+),(-?\d+)\]$/);
  let x, y, width, height;
  if (bounds) {
    x = Number(bounds[1]);
    y = Number(bounds[2]);
    width = Number(bounds[3]) - x;
    height = Number(bounds[4]) - y;
  } else {
    x = Number(attributes.x);
    y = Number(attributes.y);
    width = Number(attributes.width);
    height = Number(attributes.height);
  }
  if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) {
    return null;
  }
  const left = Math.max(0, x);
  const top = Math.max(0, y);
  const right = Math.min(viewport.width, x + width);
  const bottom = Math.min(viewport.height, y + height);
  if (right <= left || bottom <= top) {
    return null;
  }
  return {
    left: (left / viewport.width) * 100 + '%',
    top: (top / viewport.height) * 100 + '%',
    width: ((right - left) / viewport.width) * 100 + '%',
    height: ((bottom - top) / viewport.height) * 100 + '%',
  };
}

/** Preserve local evidence within each group; structural fallbacks follow contextual candidates. */
export function elementCandidates(node, proposals = []) {
  const candidates = (node?.candidates || []).map((candidate) => ({...candidate, origin: 'local'}));
  const ids = new Set(candidates.map(({id}) => id));
  const pairs = new Set(candidates.map(({strategy, selector}) => JSON.stringify([strategy, selector])));
  for (const proposal of proposals) {
    const pair = JSON.stringify([proposal.strategy, proposal.selector]);
    if (ids.has(proposal.id) || pairs.has(pair)) {
      continue;
    }
    ids.add(proposal.id);
    pairs.add(pair);
    candidates.push({...proposal, origin: 'agent', stability: proposal.structural ? 'structural' : 'contextual'});
  }
  return candidates.sort((left, right) => Number(Boolean(left.structural)) - Number(Boolean(right.structural)));
}

/** Capture the original Inspector selection; a root path is the empty string. */
export function explorerSelectionContext(props) {
  return {
    targetNodeId: props.selectedElement?.path,
    sourceXml: props.sourceXML,
    sourceJSON: props.sourceJSON,
    sourceError: Boolean(props.sourceError),
    sessionId: props.driver?.sessionId || '',
    context: props.currentContext,
    automationName: props.featureCaps?.automationName,
    platform: String(props.featureCaps?.platformName || props.driver?.capabilities?.platformName || '').toLowerCase(),
  };
}

/** Never silently retarget an open modal to another source, session, or element. */
export function isExplorerSelectionCurrent(capture, current) {
  return [
    'targetNodeId',
    'sourceXml',
    'sourceJSON',
    'sourceError',
    'sessionId',
    'context',
    'automationName',
    'platform',
  ].every((key) => capture[key] === current[key]);
}
