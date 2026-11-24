/**
 * Replaces weak locators in a recording with the Inspector's suggested ones.
 *
 * Before the first action on an element that was found with a weak locator (xpath, name, class name...)
 * or with no locator at all (returned by a script), the recorder reads the page source, finds the
 * element's node in it, and asks the Inspector's locator generation for selectors that are unique in
 * that source. The recorded step keeps both: what the client sent, and the suggested locator that the
 * generated code uses.
 */
import {getSuggestedLocators, xmlToJSON} from './inspector-lib.mjs';

// Locators good enough to keep as they are: skip the page source read for them
const STRONG_STRATEGIES = new Set(['accessibility id']);

// Most to least preferred. 'id' is left out for Windows drivers, where it is the per-run RuntimeId.
const STRATEGY_PRIORITY = [
  'accessibility id',
  'id',
  'name',
  '-android uiautomator',
  '-ios predicate string',
  '-ios class chain',
  'xpath',
  'class name',
];
const WINDOWS_DRIVERS = new Set(['windows', 'wincore']);

// element attributes read from the live element to find its node in the page source
const IDENTITY_ATTRIBUTES = {
  RuntimeId: 'RuntimeId',
  AutomationId: 'AutomationId',
  Name: 'Name',
  ClassName: 'ClassName',
  ControlType: 'ControlType',
  'resource-id': 'resource-id',
  'content-desc': 'content-desc',
  text: 'text',
};

export function needsUpgrade(el) {
  return !el?.strategy || !STRONG_STRATEGIES.has(el.strategy);
}

function nodeRect(attrs) {
  if (attrs.bounds) {
    // Android: [x1,y1][x2,y2]
    const m = /\[(-?\d+),(-?\d+)\]\[(-?\d+),(-?\d+)\]/.exec(attrs.bounds);
    if (m) {
      const [x1, y1, x2, y2] = m.slice(1).map(Number);
      return {x: x1, y: y1, width: x2 - x1, height: y2 - y1};
    }
  }
  const nums = ['x', 'y', 'width', 'height'].map((k) => Number(attrs[k]));
  return nums.every((n) => Number.isFinite(n)) ? {x: nums[0], y: nums[1], width: nums[2], height: nums[3]} : null;
}

function sameRect(a, b, tolerance = 2) {
  return !!a && !!b && ['x', 'y', 'width', 'height'].every((k) => Math.abs(Number(a[k]) - Number(b[k])) <= tolerance);
}

function* walk(node) {
  yield node;
  for (const child of node.children ?? []) {
    yield* walk(child);
  }
}

/**
 * Node of the page source (in Inspector JSON form) that is the live element described by `info`
 * ({attributes, rect}), or null when no node, or more than one node, matches equally well.
 */
export function findNodeForElement(sourceJSON, info) {
  const attrs = info.attributes ?? {};
  const tag = attrs.ControlType ? String(attrs.ControlType).replace(/^ControlType\./, '') : null;
  let best = null;
  let bestScore = 0;
  let tie = false;
  for (const node of walk(sourceJSON)) {
    // the root has no path the locator generation can address, and is not something tests act on
    if (!node.tagName || !node.path) {
      continue;
    }
    const nodeAttrs = node.attributes ?? {};
    if (attrs.RuntimeId && nodeAttrs.RuntimeId === attrs.RuntimeId) {
      return node;
    }
    let score = 0;
    let rejected = false;
    for (const [name, value] of Object.entries(attrs)) {
      if (name === 'RuntimeId' || name === 'ControlType' || !value) {
        continue;
      }
      if (name in nodeAttrs) {
        if (nodeAttrs[name] === value) {
          score += name === 'AutomationId' || name === 'resource-id' ? 4 : 2;
        } else {
          rejected = true;
          break;
        }
      }
    }
    if (rejected) {
      continue;
    }
    if (tag) {
      if (node.tagName !== tag) {
        continue;
      }
      score += 1;
    }
    if (info.rect && sameRect(nodeRect(nodeAttrs), info.rect)) {
      score += 5;
    }
    if (score > bestScore) {
      best = node;
      bestScore = score;
      tie = false;
    } else if (score === bestScore && score > 0) {
      tie = true;
    }
  }
  return best && !tie ? best : null;
}

/** Best of the Inspector's suggested locators for a node, plus all of them. */
export function suggestLocator(sourceXML, node, automationName) {
  const isWindows = WINDOWS_DRIVERS.has(String(automationName ?? '').toLowerCase());
  const suggestions = getSuggestedLocators(node, sourceXML, true, automationName).filter(
    ([strategy, selector]) => selector && !(isWindows && strategy === 'id'),
  );
  const ranked = suggestions
    .filter(([strategy]) => STRATEGY_PRIORITY.includes(strategy))
    .sort(([a], [b]) => STRATEGY_PRIORITY.indexOf(a) - STRATEGY_PRIORITY.indexOf(b));
  if (!ranked.length) {
    return null;
  }
  const [strategy, selector] = ranked[0];
  return {strategy, selector, alternatives: ranked.map(([s, v]) => ({strategy: s, selector: v}))};
}

/** Attributes and rect of the live element, as far as the driver supports them. Never throws. */
export async function readElementIdentity(driver, elementId) {
  const attributes = {};
  for (const name of Object.values(IDENTITY_ATTRIBUTES)) {
    try {
      const value = await driver.getAttribute(name, elementId);
      if (value !== null && value !== undefined && value !== '') {
        attributes[name] = String(value);
      }
    } catch {
      // attribute not supported by this driver
    }
  }
  let rect = null;
  try {
    rect = typeof driver.getElementRect === 'function' ? await driver.getElementRect(elementId) : null;
  } catch {
    // keep matching on attributes only
  }
  return {attributes, rect};
}

/**
 * Suggested locator for a live element, or null when it cannot be determined with confidence.
 * `getSource()` returns the page source (the caller caches it between state-changing commands).
 */
export async function upgradeLocator(driver, elementId, automationName, getSource) {
  const info = await readElementIdentity(driver, elementId);
  if (!Object.keys(info.attributes).length && !info.rect) {
    return null;
  }
  const xml = await getSource();
  if (!xml) {
    return null;
  }
  const node = findNodeForElement(xmlToJSON(xml), info);
  return node ? suggestLocator(xml, node, automationName) : null;
}
