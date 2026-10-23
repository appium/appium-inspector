import {select as xpathSelect} from 'xpath';

import {locatorCandidateId} from '../../embedded/candidate-verification.js';
import {childNodesOf, xmlToDOM} from '../source-parsing.js';
import {
  createEmbeddedLocatorContext,
  getEmbeddedLocatorCandidatesForNode,
  toXPathLiteral,
} from './embedded-candidates.js';

const candidateStability = (candidate) => {
  if (candidate.structural) {
    return 'structural';
  }
  // Uniqueness describes this snapshot; it is not evidence of temporal stability.
  if (
    candidate.source === 'resource-id' ||
    candidate.source === 'id' ||
    candidate.source === 'content-desc' ||
    candidate.source === 'name'
  ) {
    return 'stable';
  }
  return 'contextual';
};

const visibilityOf = (attributes) => {
  const values = [attributes.visible, attributes.displayed].filter((value) => value !== undefined);
  if (values.some((value) => value === 'false' || value === '0')) {
    return false;
  }
  return values.some((value) => value === 'true' || value === '1') ? true : null;
};

const interactiveOf = (tag, attributes) => {
  if (attributes.enabled === 'false' || attributes.enabled === '0') {
    return false;
  }
  return (
    ['clickable', 'long-clickable', 'scrollable', 'focusable'].some(
      (key) => attributes[key] === 'true' || attributes[key] === '1',
    ) ||
    /(?:Button|EditText|TextField|SearchField|SecureTextField|Switch|CheckBox|Slider|Picker)$/.test(
      attributes.type || attributes.class || tag,
    )
  );
};

function xpathMetadata(selector) {
  const expression = selector.replace(/"[^"]*"|'[^']*'/g, '');
  const structural = /\[\s*\(*\s*[-+]?\d|\b(?:position|last)\s*\(/.test(expression);
  if (structural) {
    return {structural, xpathStrategy: 'Posición (frágil)'};
  }
  if (
    /@(?:text|label|content-desc|name)\b/.test(expression) &&
    /\/(?:parent::[^/]+|\.\.)\/(?:child::)?[^/.]/.test(expression)
  ) {
    return {structural, xpathStrategy: 'Etiqueta → padre → hijo'};
  }
  if (/\b(?:ancestor|ancestor-or-self)::/.test(expression)) {
    return {structural, xpathStrategy: 'Ancestro'};
  }
  if (/\b(?:following-sibling|preceding-sibling)::/.test(expression)) {
    return {structural, xpathStrategy: 'Hermano'};
  }
  if (/\bparent::|\/\.\.(?:\/|$|\[)/.test(expression)) {
    return {structural, xpathStrategy: 'Padre'};
  }
  if (/\b(?:descendant|descendant-or-self)::|[^/]\/\//.test(expression)) {
    return {structural, xpathStrategy: 'Descendiente'};
  }
  if (/\bchild::|[^/]\/(?![/@.])/.test(expression)) {
    return {structural, xpathStrategy: 'Hijo'};
  }
  return {structural, xpathStrategy: /@/.test(expression) ? 'Atributos del elemento' : 'Tipo de elemento'};
}

const anchorAttributes = ['resource-id', 'id', 'content-desc', 'name', 'label', 'text'];

/** Attribute anchors are indexed once; never enumerate every pair of XML nodes. */
function relationCandidates(context) {
  const anchors = new Map();
  const childrenByParent = new Map();
  for (const element of context.nodes) {
    const children = childrenByParent.get(element.parentNode) || [];
    children.push(element);
    childrenByParent.set(element.parentNode, children);
    const attribute = anchorAttributes.find((name) => {
      const value = element.getAttribute(name);
      return value && context.byAttribute.get(name)?.get(value)?.size === 1;
    });
    if (attribute) {
      const predicate = '@' + attribute + '=' + toXPathLiteral(element.getAttribute(attribute));
      anchors.set(element, {
        attribute,
        value: JSON.stringify(element.getAttribute(attribute)),
        selector: '//*[' + predicate + ']',
        predicate,
      });
    }
  }
  const neighbors = new Map();
  for (const children of childrenByParent.values()) {
    let previous;
    for (const element of children) {
      neighbors.set(element, {previous});
      if (anchors.has(element)) {
        previous = element;
      }
    }
    let next;
    for (let index = children.length - 1; index >= 0; index--) {
      const element = children[index];
      neighbors.get(element).next = next;
      if (anchors.has(element)) {
        next = element;
      }
    }
  }
  return (element) => {
    const results = [];
    const targetAttribute = [...anchorAttributes, 'class', 'type'].find((name) => element.getAttribute(name));
    const test =
      element.tagName +
      (targetAttribute
        ? '[@' + targetAttribute + '=' + toXPathLiteral(element.getAttribute(targetAttribute)) + ']'
        : '');
    const add = (selector, reason) => {
      if (selector.length > 2048 || results.some((candidate) => candidate.selector === selector)) {
        return false;
      }
      try {
        const matches = xpathSelect(selector, context.document);
        if (!Array.isArray(matches) || matches.length !== 1 || matches[0] !== element) {
          return false;
        }
      } catch {
        return false;
      }
      const metadata = xpathMetadata(selector);
      results.push({
        id: locatorCandidateId('xpath', selector),
        label: 'XPath · ' + metadata.xpathStrategy,
        strategy: 'xpath',
        selector,
        reason,
        unique: true,
        uniqueness: 'unique',
        priority: 35,
        source: 'relationship',
        stability: 'contextual',
        ...metadata,
      });
      return true;
    };
    const parent = element.parentNode;
    const parentAnchor = anchors.get(parent);
    if (parentAnchor) {
      add(
        parentAnchor.selector + '/child::' + test,
        'Identifica el padre por ' +
          parentAnchor.attribute +
          '=' +
          parentAnchor.value +
          ' y busca su hijo ' +
          element.tagName +
          '.',
      );
    }
    for (const child of childrenByParent.get(element) || []) {
      const anchor = anchors.get(child);
      if (
        anchor &&
        add(
          anchor.selector + '/parent::' + test,
          'Identifica al hijo por ' +
            anchor.attribute +
            '=' +
            anchor.value +
            ' y obtiene su padre ' +
            element.tagName +
            '.',
        )
      ) {
        break;
      }
    }
    for (let ancestor = parent?.parentNode; ancestor?.nodeType === 1; ancestor = ancestor.parentNode) {
      const anchor = anchors.get(ancestor);
      if (
        anchor &&
        add(
          '//' + test + '[ancestor::' + ancestor.tagName + '[' + anchor.predicate + ']]',
          'Limita ' + element.tagName + ' al ancestro con ' + anchor.attribute + '=' + anchor.value + '.',
        )
      ) {
        break;
      }
    }
    const nearby = neighbors.get(element) || {};
    for (const [sibling, axis] of [
      [nearby.previous, 'following-sibling'],
      [nearby.next, 'preceding-sibling'],
    ]) {
      const anchor = anchors.get(sibling);
      if (!anchor) {
        continue;
      }
      add(
        anchor.selector + '/' + axis + '::' + test,
        'Parte de ' +
          anchor.attribute +
          '=' +
          anchor.value +
          ' y busca un hermano ' +
          (axis === 'following-sibling' ? 'posterior' : 'anterior') +
          ' del mismo contenedor.',
      );
      if (['text', 'label', 'content-desc', 'name'].includes(anchor.attribute) && parent?.nodeType === 1) {
        add(
          anchor.selector + '/parent::' + parent.tagName + '/child::' + test,
          'Usa la etiqueta ' +
            anchor.value +
            ' (' +
            anchor.attribute +
            '), sube al padre común y selecciona su hijo ' +
            element.tagName +
            '.',
        );
      }
    }
    return results;
  };
}

/**
 * Build every node from one immutable source snapshot in sourceJSON preorder.
 * A nodeId is a source-tree path, never a WebDriver element ID. The empty path
 * identifies the document element, including hierarchy/AppiumAUT containers.
 */
export function buildElementCatalog(sourceXML, isNative, automationName) {
  if (typeof sourceXML !== 'string' || !sourceXML.trim()) {
    return {nodes: [], roots: []};
  }
  const document = xmlToDOM(sourceXML);
  const root = document.documentElement;
  if (!root) {
    return {nodes: [], roots: []};
  }
  const context = createEmbeddedLocatorContext(document);
  const relational = relationCandidates(context);
  const nodes = [];
  const pending = [{element: root, path: '', parentId: null, referenceSelector: '/*[1]'}];
  while (pending.length) {
    const {element, path, parentId, referenceSelector} = pending.pop();
    const attributes = Object.fromEntries(
      Array.from(element.attributes || [], (attribute) => [attribute.name, attribute.value]),
    );
    const candidates = getEmbeddedLocatorCandidatesForNode(document, element, isNative, automationName, {
      referenceSelector,
    }).map((candidate) => ({
      ...candidate,
      ...(candidate.strategy === 'xpath' ? xpathMetadata(candidate.selector) : {}),
      stability: candidateStability(candidate),
    }));
    if (candidates.length && !candidates.some((candidate) => candidate.unique === true && !candidate.structural)) {
      const selectors = new Set(
        candidates.filter((candidate) => candidate.strategy === 'xpath').map(({selector}) => selector),
      );
      candidates.push(...relational(element).filter(({selector}) => !selectors.has(selector)));
      candidates.sort(
        (left, right) =>
          Number(left.structural) - Number(right.structural) ||
          Number(right.unique === true) - Number(left.unique === true) ||
          left.priority - right.priority,
      );
    }
    nodes.push({
      nodeId: path,
      path,
      parentId,
      tag: element.tagName,
      attributes,
      visible: visibilityOf(attributes),
      interactive: interactiveOf(element.tagName, attributes),
      label:
        attributes['content-desc'] ||
        attributes.name ||
        attributes.label ||
        attributes.text ||
        attributes['resource-id'] ||
        element.tagName,
      referenceSelector,
      candidates,
    });
    const children = childNodesOf(element);
    for (let index = children.length - 1; index >= 0; index--) {
      pending.push({
        element: children[index],
        path: path === '' ? String(index) : path + '.' + index,
        parentId: path,
        referenceSelector: referenceSelector + '/*[' + (index + 1) + ']',
      });
    }
  }
  return {nodes, roots: ['']};
}

function explorerError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

/**
 * Resolve identity using the snapshot's exact structural reference first,
 * independently of the candidate. No clicking, navigation or state mutation.
 * The host still performs the framework TypeLocator round-trip on transfer.
 */
export async function verifyExplorerCandidate({node, candidate, findElements, isCurrent}) {
  const assertCurrent = () => {
    if (typeof isCurrent !== 'function' || !isCurrent()) {
      throw explorerError('STALE_SNAPSHOT', 'La pantalla cambió; vuelve a analizar sus elementos.');
    }
  };
  assertCurrent();
  if (typeof node?.referenceSelector !== 'string' || !node.referenceSelector.startsWith('/')) {
    throw explorerError('INVALID_REFERENCE', 'El nodo no tiene una referencia estructural válida.');
  }
  if (
    typeof candidate?.strategy !== 'string' ||
    !candidate.strategy.trim() ||
    typeof candidate?.selector !== 'string' ||
    !candidate.selector.trim() ||
    candidate.strategy.length > 64 ||
    candidate.selector.length > 2048
  ) {
    throw explorerError('INVALID_CANDIDATE', 'La estrategia y el selector del candidato no son válidos.');
  }
  if (typeof findElements !== 'function') {
    throw explorerError('LOOKUP_FAILED', 'No hay una sesión disponible para verificar el elemento.');
  }
  const lookup = async (locator) => {
    assertCurrent();
    let matches;
    try {
      matches = await findElements(locator);
    } catch (error) {
      assertCurrent();
      throw explorerError(
        'LOOKUP_FAILED',
        'No se pudo verificar el locator: ' + (error instanceof Error ? error.message : String(error)),
      );
    }
    assertCurrent();
    if (!Array.isArray(matches) || matches.some((id) => typeof id !== 'string' || !id)) {
      throw explorerError('LOOKUP_FAILED', 'Appium devolvió identidades de elemento no válidas.');
    }
    return matches;
  };
  const reference = {strategy: 'xpath', selector: node.referenceSelector};
  const referenceMatches = await lookup(reference);
  if (referenceMatches.length !== 1) {
    throw explorerError(
      'REFERENCE_NOT_EXACT',
      'La referencia del nodo encontró ' + referenceMatches.length + ' elementos; actualiza la pantalla.',
    );
  }
  const primary = {strategy: candidate.strategy.trim(), selector: candidate.selector.trim()};
  const matches = await lookup(primary);
  if (matches.length !== 1) {
    throw explorerError(
      'CANDIDATE_NOT_EXACT',
      'El candidato encontró ' + matches.length + ' elementos; debe identificar uno solo.',
    );
  }
  const elementId = referenceMatches[0];
  if (matches[0] !== elementId) {
    throw explorerError('DIFFERENT_ELEMENT', 'El candidato encuentra un elemento distinto al nodo seleccionado.');
  }
  const referenceAfter = await lookup(reference);
  if (referenceAfter.length !== 1 || referenceAfter[0] !== elementId) {
    throw explorerError('STALE_SNAPSHOT', 'El nodo cambió durante la verificación; vuelve a analizar la pantalla.');
  }
  const stability = ['stable', 'contextual', 'structural', 'manual'].includes(candidate.stability)
    ? candidate.stability
    : candidateStability(candidate);
  const compact = {
    candidateId:
      typeof candidate.id === 'string' && candidate.id.length > 0 && candidate.id.length <= 128
        ? candidate.id
        : locatorCandidateId(primary.strategy, primary.selector),
    ...primary,
    priority:
      Number.isInteger(candidate.priority) && candidate.priority >= 0 && candidate.priority <= 1_000_000
        ? candidate.priority
        : 0,
    stability,
    sourceReason: String(candidate.reason || 'Candidato del explorador de elementos').slice(0, 256),
    matchCount: 1,
    sameElement: true,
  };
  return {elementId, candidate: compact, candidates: [compact]};
}
