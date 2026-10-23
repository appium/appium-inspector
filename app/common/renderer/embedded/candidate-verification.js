import {EmbeddedProtocolError} from './protocol.js';

export const MAX_VERIFIED_LOCATOR_CANDIDATES = 50;

const STABILITY_ORDER = {
  stable: 0,
  contextual: 1,
  structural: 2,
  manual: 3,
};

const stableHash = (value) => {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
};

export const normalizeLocatorIdentity = (strategy, selector) => `${strategy.trim().toLowerCase()}\0${selector.trim()}`;

export const locatorCandidateId = (strategy, selector) =>
  `${strategy.trim().replaceAll(/[^a-z0-9]+/gi, '-')}-${stableHash(normalizeLocatorIdentity(strategy, selector))}`;

const candidateStability = (candidate) => {
  if (candidate.structural) {
    return 'structural';
  }
  return candidate.unique === true ? 'stable' : 'contextual';
};

const compactCandidate = (candidate, strategy, selector, isManual) => ({
  candidateId: candidate?.id || locatorCandidateId(strategy, selector),
  strategy,
  selector,
  priority: Number.isInteger(candidate?.priority) && candidate.priority >= 0 ? candidate.priority : 0,
  stability: isManual ? 'manual' : candidateStability(candidate),
  sourceReason: candidate?.reason || (isManual ? 'Manual Inspector selection' : 'Inspector locator recommendation'),
});

export const prepareLocatorCandidates = (primary, proposedCandidates) => {
  const strategy = primary.strategy.trim();
  const selector = primary.selector.trim();
  const primaryIdentity = normalizeLocatorIdentity(strategy, selector);
  const matchingCandidate = proposedCandidates.find(
    (candidate) =>
      candidate.strategy?.trim() &&
      candidate.selector?.trim() &&
      normalizeLocatorIdentity(candidate.strategy, candidate.selector) === primaryIdentity,
  );
  const preparedPrimary = compactCandidate(matchingCandidate, strategy, selector, !matchingCandidate);
  const identities = new Set([primaryIdentity]);
  const candidateIds = new Set([preparedPrimary.candidateId]);
  const alternatives = [];

  for (const candidate of proposedCandidates) {
    const candidateStrategy = candidate.strategy?.trim();
    const candidateSelector = candidate.selector?.trim();
    if (!candidateStrategy || !candidateSelector) {
      continue;
    }
    const identity = normalizeLocatorIdentity(candidateStrategy, candidateSelector);
    if (identities.has(identity)) {
      continue;
    }
    identities.add(identity);
    const preparedCandidate = compactCandidate(candidate, candidateStrategy, candidateSelector, false);
    if (candidateIds.has(preparedCandidate.candidateId)) {
      preparedCandidate.candidateId = locatorCandidateId(candidateStrategy, candidateSelector);
    }
    let suffix = 2;
    const baseCandidateId = preparedCandidate.candidateId;
    while (candidateIds.has(preparedCandidate.candidateId)) {
      preparedCandidate.candidateId = `${baseCandidateId}-${suffix}`;
      suffix += 1;
    }
    candidateIds.add(preparedCandidate.candidateId);
    alternatives.push(preparedCandidate);
  }

  alternatives.sort(
    (left, right) =>
      STABILITY_ORDER[left.stability] - STABILITY_ORDER[right.stability] ||
      left.priority - right.priority ||
      left.candidateId.localeCompare(right.candidateId),
  );
  return [preparedPrimary, ...alternatives].slice(0, MAX_VERIFIED_LOCATOR_CANDIDATES);
};

const verifiedCandidate = (candidate) => ({
  ...candidate,
  matchCount: 1,
  sameElement: true,
});

const primaryVerificationError = (code, message) => new EmbeddedProtocolError(code, message);

export async function verifyLocatorCandidates({
  primary,
  proposedCandidates,
  selectedElementId,
  adoptedElementId,
  findElements,
  onAlternativeError,
}) {
  if (!selectedElementId) {
    throw primaryVerificationError(
      'SELECTED_ELEMENT_UNRESOLVED',
      'Espera a que Inspector resuelva el elemento seleccionado antes de enviarlo al Recorder.',
    );
  }

  const [primaryCandidate, ...alternatives] = prepareLocatorCandidates(primary, proposedCandidates);
  let primaryMatches;
  try {
    primaryMatches = await findElements(primaryCandidate);
  } catch (error) {
    throw primaryVerificationError(
      'PRIMARY_LOOKUP_FAILED',
      `El locator principal no se pudo ejecutar: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (!Array.isArray(primaryMatches)) {
    throw primaryVerificationError(
      'PRIMARY_LOOKUP_FAILED',
      'El locator principal devolvió una respuesta no válida de Appium.',
    );
  }
  if (primaryMatches.length !== 1) {
    throw primaryVerificationError(
      'PRIMARY_NOT_EXACT',
      `El locator principal debe encontrar exactamente un elemento; encontró ${primaryMatches.length}. Ajusta el locator e inténtalo de nuevo.`,
    );
  }
  const matchedElementId = primaryMatches[0];
  let verificationElementId = selectedElementId;
  if (matchedElementId !== selectedElementId) {
    const isManualPrimary = primaryCandidate.stability === 'manual';
    if (isManualPrimary && adoptedElementId === matchedElementId) {
      verificationElementId = matchedElementId;
    } else if (isManualPrimary && !adoptedElementId) {
      const error = primaryVerificationError(
        'MANUAL_ELEMENT_CONFIRMATION_REQUIRED',
        'El locator manual encuentra exactamente otro elemento. Revisa el resultado antes de usarlo en el Recorder.',
      );
      error.selectedElementId = selectedElementId;
      error.matchedElementId = matchedElementId;
      error.strategy = primaryCandidate.strategy;
      error.selector = primaryCandidate.selector;
      throw error;
    } else {
      throw primaryVerificationError(
        'PRIMARY_DIFFERENT_ELEMENT',
        'El locator principal encuentra un elemento distinto al seleccionado. Ajusta el locator e inténtalo de nuevo.',
      );
    }
  }
  if (adoptedElementId && adoptedElementId !== matchedElementId) {
    throw primaryVerificationError(
      'PRIMARY_DIFFERENT_ELEMENT',
      'El elemento encontrado cambió antes de confirmar. Ejecuta nuevamente el locator manual.',
    );
  }

  const verified = [verifiedCandidate(primaryCandidate)];
  for (const candidate of alternatives) {
    try {
      const matches = await findElements(candidate);
      if (Array.isArray(matches) && matches.length === 1 && matches[0] === verificationElementId) {
        verified.push(verifiedCandidate(candidate));
      }
    } catch (error) {
      onAlternativeError?.(candidate, error);
    }
  }
  return verified;
}
