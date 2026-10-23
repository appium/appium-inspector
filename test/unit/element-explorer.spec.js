import {afterEach, describe, expect, it, vi} from 'vitest';
import {select as xpathSelect} from 'xpath';

import {
  buildElementCatalog,
  verifyExplorerCandidate,
} from '../../app/common/renderer/utils/locator-generation/element-explorer.js';
import {
  createEmbeddedLocatorContext,
  getEmbeddedLocatorCandidates,
  getEmbeddedLocatorCandidatesForNode,
} from '../../app/common/renderer/utils/locator-generation/embedded-candidates.js';
import * as sourceParsing from '../../app/common/renderer/utils/source-parsing.js';

afterEach(() => vi.restoreAllMocks());

const androidSource =
  '<hierarchy rotation="0">' +
  '<android.widget.FrameLayout displayed="true">' +
  '<android.widget.Button resource-id="com.example:id/continue" text="Continuar" clickable="true" />' +
  '<android.widget.TextView text="Oculto" displayed="false" />' +
  '</android.widget.FrameLayout>' +
  '<android.widget.Button resource-id="com.example:id/cancel" text="Cancelar" />' +
  '</hierarchy>';

describe('element explorer catalog', () => {
  it('includes containers, hidden nodes, root and all paths in the sourceJSON preorder', () => {
    const catalog = buildElementCatalog(androidSource, true, 'uiautomator2');
    const sourceJSON = sourceParsing.xmlToJSON(androidSource);
    expect(catalog.roots).toEqual(['']);
    expect(catalog.nodes.map((node) => [node.nodeId, node.parentId])).toEqual([
      ['', null],
      ['0', ''],
      ['0.0', '0'],
      ['0.1', '0'],
      ['1', ''],
    ]);
    for (const node of catalog.nodes.slice(1)) {
      const sourceNode = sourceParsing.findJSONElementByPath(node.path, sourceJSON);
      expect(node.tag).toBe(sourceNode.tagName);
      expect(node.attributes).toEqual(sourceNode.attributes);
    }
    expect(catalog.nodes[0]).toMatchObject({tag: 'hierarchy', visible: null});
    expect(catalog.nodes[1]).toMatchObject({visible: true});
    expect(catalog.nodes[2]).toMatchObject({label: 'Continuar', interactive: true});
    expect(catalog.nodes[3]).toMatchObject({label: 'Oculto', visible: false, interactive: false});
  });

  it('includes explicitly clickable text in the interactive filter', () => {
    const source = '<hierarchy><android.widget.TextView text="Continuar" clickable="true" /></hierarchy>';
    expect(buildElementCatalog(source, true, 'uiautomator2').nodes[1].interactive).toBe(true);
  });

  it('references the exact XML node independently of generated locator attributes', () => {
    const source = '<hierarchy><node text="Same"/><node text="Same"><node text="Same"/></node></hierarchy>';
    const catalog = buildElementCatalog(source, true, 'uiautomator2');
    const document = sourceParsing.xmlToDOM(source);
    const allNodes = Array.from(document.getElementsByTagName('*'));
    expect(catalog.nodes.map((node) => node.referenceSelector)).toEqual([
      '/*[1]',
      '/*[1]/*[1]',
      '/*[1]/*[2]',
      '/*[1]/*[2]/*[1]',
    ]);
    for (const [index, node] of catalog.nodes.entries()) {
      expect(xpathSelect(node.referenceSelector, document)).toEqual([allNodes[index]]);
    }
  });

  it('parses the XML once and preserves raw attribute strings including newlines and quotes', () => {
    const parse = vi.spyOn(sourceParsing, 'xmlToDOM');
    const source = '<hierarchy><node text="A&#10;B &quot;C&quot;" value="001" /></hierarchy>';
    const catalog = buildElementCatalog(source, true, 'uiautomator2');
    expect(parse).toHaveBeenCalledTimes(1);
    expect(catalog.nodes[1].attributes).toEqual({text: 'A\nB "C"', value: '001'});
  });

  it('reports uniqueness separately from stability for identifiers and dynamic text', () => {
    const source =
      '<hierarchy>' +
      '<node resource-id="com.example:id/row" text="Unique balance" />' +
      '<node resource-id="com.example:id/row" text="Another balance" />' +
      '</hierarchy>';
    const node = buildElementCatalog(source, true, 'uiautomator2').nodes[1];
    expect(node.candidates.find((candidate) => candidate.strategy === 'id')).toMatchObject({
      unique: false,
      uniqueness: 'non-unique',
      stability: 'stable',
    });
    expect(node.candidates.find((candidate) => candidate.label === 'UIAutomator text')).toMatchObject({
      unique: true,
      uniqueness: 'unique',
      stability: 'contextual',
    });
    expect(node.candidates.find((candidate) => candidate.structural)).toMatchObject({
      selector: node.referenceSelector,
      stability: 'structural',
      unique: true,
    });
  });

  it('generates iOS candidates without Android strategies and retains disabled controls', () => {
    const source =
      '<AppiumAUT><XCUIElementTypeButton type="XCUIElementTypeButton" ' +
      'name="Continue" label="Continuar" visible="true" enabled="false" /></AppiumAUT>';
    const node = buildElementCatalog(source, true, 'xcuitest').nodes[1];
    expect(node).toMatchObject({visible: true, interactive: false, label: 'Continue'});
    expect(node.candidates.map((candidate) => candidate.strategy)).toEqual(
      expect.arrayContaining(['accessibility id', '-ios predicate string', '-ios class chain', 'xpath']),
    );
    expect(node.candidates.some((candidate) => candidate.strategy === '-android uiautomator')).toBe(false);
  });

  it('retains the full tree with no generated strategies for unsupported contexts', () => {
    const web = buildElementCatalog('<html><body><button id="pay" /></body></html>', false, 'xcuitest');
    const unsupported = buildElementCatalog(androidSource, true, 'espresso');
    expect(web.nodes).toHaveLength(3);
    expect(web.nodes.every((node) => node.candidates.length === 0)).toBe(true);
    expect(unsupported.nodes).toHaveLength(5);
    expect(unsupported.nodes.every((node) => node.candidates.length === 0)).toBe(true);
  });

  it('supports an empty source without creating a fictitious element', () => {
    expect(buildElementCatalog('', true, 'uiautomator2')).toEqual({nodes: [], roots: []});
    expect(buildElementCatalog('   ', true, 'uiautomator2')).toEqual({nodes: [], roots: []});
  });

  it('does not truncate a large tree and indexes candidates from its final node', () => {
    const count = 1800;
    const source =
      '<hierarchy>' +
      Array.from(
        {length: count},
        (_, index) =>
          '<node class="android.widget.Button" resource-id="com.example:id/item' +
          index +
          '" text="Item ' +
          index +
          '" />',
      ).join('') +
      '</hierarchy>';
    const catalog = buildElementCatalog(source, true, 'uiautomator2');
    expect(catalog.nodes).toHaveLength(count + 1);
    expect(catalog.nodes.at(-1).nodeId).toBe(String(count - 1));
    expect(catalog.nodes.at(-1).candidates.find((candidate) => candidate.strategy === 'id')).toMatchObject({
      selector: 'com.example:id/item1799',
      unique: true,
    });
    expect(
      catalog.nodes[2].candidates.find((candidate) => candidate.label === 'UIAutomator textContains'),
    ).toMatchObject({
      unique: false,
    });
  });

  it.each([
    [
      'uiautomator2',
      '<hierarchy><node class="android.widget.Button" text="Same" /><node class="android.widget.TextView" text="Same" /></hierarchy>',
    ],
    [
      'xcuitest',
      '<AppiumAUT><XCUIElementTypeButton type="XCUIElementTypeButton" name="First" label="Shared" /><XCUIElementTypeButton type="XCUIElementTypeButton" name="Second" label="Shared" /></AppiumAUT>',
    ],
  ])('shared indexes preserve existing candidate results for %s', (driver, source) => {
    const legacy = getEmbeddedLocatorCandidates({path: '0'}, source, true, driver);
    const document = sourceParsing.xmlToDOM(source);
    const context = createEmbeddedLocatorContext(document);
    expect(createEmbeddedLocatorContext(document)).toBe(context);
    const node = sourceParsing.findDOMNodeByPath('0', document);
    expect(getEmbeddedLocatorCandidatesForNode(document, node, true, driver)).toEqual(legacy);
  });

  it('offers validated parent, child, sibling and label-chain relationships before positional fallback', () => {
    const source =
      '<hierarchy><Card><Label text="Carla"/><Button text="Pay"/></Card>' +
      '<Card><Label text="Luis"/><Button text="Pay"/></Card></hierarchy>';
    const catalog = buildElementCatalog(source, true, 'uiautomator2');
    const document = sourceParsing.xmlToDOM(source);
    const target = catalog.nodes.find((node) => node.nodeId === '0.1');
    const labelChain = target.candidates.find((candidate) => candidate.xpathStrategy === 'Etiqueta → padre → hijo');
    const sibling = target.candidates.find((candidate) => candidate.xpathStrategy === 'Hermano');
    expect(labelChain).toMatchObject({unique: true, structural: false, stability: 'contextual'});
    expect(sibling).toMatchObject({unique: true, structural: false});
    expect(labelChain.reason).toContain('"Carla"');
    expect(sibling.reason).toContain('hermano posterior');
    expect(sibling.reason).not.toContain('adyacente');
    const selected = xpathSelect(target.referenceSelector, document)[0];
    for (const candidate of target.candidates.filter((entry) => entry.source === 'relationship')) {
      expect(xpathSelect(candidate.selector, document)).toEqual([selected]);
    }
    expect(target.candidates.indexOf(labelChain)).toBeLessThan(
      target.candidates.findIndex((entry) => entry.structural),
    );
    const parent = catalog.nodes.find((node) => node.nodeId === '0');
    expect(parent.candidates.find((candidate) => candidate.xpathStrategy === 'Padre')).toMatchObject({unique: true});

    const identified =
      '<hierarchy><Card resource-id="com.app:id/recipient"><Button text="Pay"/></Card>' +
      '<Card><Button text="Pay"/></Card></hierarchy>';
    const child = buildElementCatalog(identified, true, 'uiautomator2').nodes.find((node) => node.nodeId === '0.0');
    expect(child.candidates.find((candidate) => candidate.xpathStrategy === 'Hijo')).toMatchObject({
      unique: true,
      structural: false,
    });
  });

  it('uses an identified ancestor without inventing sibling positions', () => {
    const source =
      '<hierarchy><Section resource-id="com.app:id/recipient"><Box><Button text="Pay"/></Box></Section>' +
      '<Section><Box><Button text="Pay"/></Box></Section></hierarchy>';
    const catalog = buildElementCatalog(source, true, 'uiautomator2');
    const target = catalog.nodes.find((node) => node.nodeId === '0.0.0');
    const candidate = target.candidates.find((entry) => entry.xpathStrategy === 'Ancestro');
    expect(candidate).toMatchObject({unique: true, structural: false});
    const document = sourceParsing.xmlToDOM(source);
    expect(xpathSelect(candidate.selector, document)).toEqual(xpathSelect(target.referenceSelector, document));
  });

  it('rejects local relations that still point to several identical children', () => {
    const source =
      '<hierarchy><Card name="Recipient"><Label text="Carla"/><Button text="Pay"/><Button text="Pay"/></Card></hierarchy>';
    const target = buildElementCatalog(source, true, 'uiautomator2').nodes.find((node) => node.nodeId === '0.1');
    expect(target.candidates.filter((candidate) => candidate.source === 'relationship')).toEqual([]);
    expect(target.candidates.find((candidate) => candidate.structural)).toMatchObject({
      xpathStrategy: 'Posición (frágil)',
      stability: 'structural',
      unique: true,
    });
  });

  it('escapes quoted label anchors and preserves iOS strategies', () => {
    const source =
      '<AppiumAUT><XCUIElementTypeOther><XCUIElementTypeStaticText label="A &quot;quote&quot; and &apos;apostrophe&apos;"/>' +
      '<XCUIElementTypeButton label="Pay"/></XCUIElementTypeOther>' +
      '<XCUIElementTypeOther><XCUIElementTypeButton label="Pay"/></XCUIElementTypeOther></AppiumAUT>';
    const catalog = buildElementCatalog(source, true, 'xcuitest');
    const target = catalog.nodes.find((node) => node.nodeId === '0.1');
    const candidate = target.candidates.find((entry) => entry.xpathStrategy === 'Etiqueta → padre → hijo');
    expect(candidate).toMatchObject({strategy: 'xpath', unique: true});
    expect(candidate.selector).toContain('concat(');
    const document = sourceParsing.xmlToDOM(source);
    expect(xpathSelect(candidate.selector, document)).toEqual(xpathSelect(target.referenceSelector, document));
  });

  it('preserves direct unique identifiers without adding redundant relation candidates', () => {
    const source = '<hierarchy><Card><Label text="Carla"/><Button resource-id="com.app:id/pay"/></Card></hierarchy>';
    const target = buildElementCatalog(source, true, 'uiautomator2').nodes.find((node) => node.nodeId === '0.1');
    expect(target.candidates.some((candidate) => candidate.strategy === 'id' && candidate.unique)).toBe(true);
    expect(target.candidates.some((candidate) => candidate.source === 'relationship')).toBe(false);
  });

  it('keeps candidate identities deterministic across snapshots of the same XML', () => {
    const first = buildElementCatalog(androidSource, true, 'uiautomator2');
    const second = buildElementCatalog(androidSource, true, 'uiautomator2');
    expect(first).toEqual(second);
  });
});

const target = {nodeId: '0', referenceSelector: '/*[1]/*[1]'};
const proposed = {
  id: 'resource-continue',
  strategy: 'id',
  selector: 'com.example:id/continue',
  priority: 10,
  unique: true,
  stability: 'stable',
  reason: 'Identificador de recurso',
};

describe('element explorer live identity verification', () => {
  it('anchors to an independent reference, verifies the candidate and rechecks the reference', async () => {
    const findElements = vi.fn(async () => ['element-1']);
    const result = await verifyExplorerCandidate({
      node: target,
      candidate: proposed,
      findElements,
      isCurrent: () => true,
    });
    expect(findElements.mock.calls.map(([locator]) => locator)).toEqual([
      {strategy: 'xpath', selector: target.referenceSelector},
      {strategy: 'id', selector: proposed.selector},
      {strategy: 'xpath', selector: target.referenceSelector},
    ]);
    expect(result).toEqual({
      elementId: 'element-1',
      candidate: {
        candidateId: proposed.id,
        strategy: proposed.strategy,
        selector: proposed.selector,
        priority: 10,
        stability: 'stable',
        sourceReason: proposed.reason,
        matchCount: 1,
        sameElement: true,
      },
      candidates: [expect.objectContaining({candidateId: proposed.id, matchCount: 1, sameElement: true})],
    });
  });

  it.each([{matches: []}, {matches: ['one', 'two']}])(
    'rejects a non-unique XML reference before trying an AI candidate: $matches',
    async ({matches}) => {
      const findElements = vi.fn(async () => matches);
      await expect(
        verifyExplorerCandidate({
          node: target,
          candidate: proposed,
          findElements,
          isCurrent: () => true,
        }),
      ).rejects.toMatchObject({code: 'REFERENCE_NOT_EXACT'});
      expect(findElements).toHaveBeenCalledTimes(1);
    },
  );

  it.each([{matches: []}, {matches: ['element-1', 'another']}])(
    'rejects a non-unique candidate even if marked unique: $matches',
    async ({matches}) => {
      const findElements = vi.fn().mockResolvedValueOnce(['element-1']).mockResolvedValueOnce(matches);
      await expect(
        verifyExplorerCandidate({
          node: target,
          candidate: proposed,
          findElements,
          isCurrent: () => true,
        }),
      ).rejects.toMatchObject({code: 'CANDIDATE_NOT_EXACT'});
    },
  );

  it('rejects a unique candidate that resolves another element', async () => {
    const findElements = vi.fn().mockResolvedValueOnce(['selected']).mockResolvedValueOnce(['different']);
    await expect(
      verifyExplorerCandidate({
        node: target,
        candidate: proposed,
        findElements,
        isCurrent: () => true,
      }),
    ).rejects.toMatchObject({code: 'DIFFERENT_ELEMENT'});
  });

  it('rejects a reference that changes during candidate resolution', async () => {
    const findElements = vi
      .fn()
      .mockResolvedValueOnce(['selected'])
      .mockResolvedValueOnce(['selected'])
      .mockResolvedValueOnce(['replacement']);
    await expect(
      verifyExplorerCandidate({
        node: target,
        candidate: proposed,
        findElements,
        isCurrent: () => true,
      }),
    ).rejects.toMatchObject({code: 'STALE_SNAPSHOT'});
  });

  it.each([0, 1, 2, 3])('discards stale state before/after lookup %i', async (changedAt) => {
    let calls = 0;
    const findElements = vi.fn(async () => {
      calls++;
      return ['element-1'];
    });
    await expect(
      verifyExplorerCandidate({
        node: target,
        candidate: proposed,
        findElements,
        isCurrent: () => calls < changedAt,
      }),
    ).rejects.toMatchObject({code: 'STALE_SNAPSHOT'});
    expect(findElements).toHaveBeenCalledTimes(changedAt);
  });

  it('prefers a stale-state result over an Appium error from the obsolete session', async () => {
    let current = true;
    const findElements = vi.fn(async () => {
      current = false;
      throw new Error('session closed');
    });
    await expect(
      verifyExplorerCandidate({
        node: target,
        candidate: proposed,
        findElements,
        isCurrent: () => current,
      }),
    ).rejects.toMatchObject({code: 'STALE_SNAPSHOT'});
  });

  it.each([{response: null}, {response: {}}, {response: ['']}, {response: [null]}])(
    'rejects malformed identity responses: $response',
    async ({response}) => {
      await expect(
        verifyExplorerCandidate({
          node: target,
          candidate: proposed,
          findElements: async () => response,
          isCurrent: () => true,
        }),
      ).rejects.toMatchObject({code: 'LOOKUP_FAILED'});
    },
  );

  it('does not infer temporal stability from a unique text locator', async () => {
    const result = await verifyExplorerCandidate({
      node: target,
      candidate: {...proposed, stability: undefined, source: 'text', strategy: 'xpath', selector: '//*[@text="Today"]'},
      findElements: async () => ['element-1'],
      isCurrent: () => true,
    });
    expect(result.candidate.stability).toBe('contextual');
    expect(result.candidate.matchCount).toBe(1);
  });

  it('requires valid locator input and a current snapshot without making Appium calls', async () => {
    const findElements = vi.fn();
    await expect(
      verifyExplorerCandidate({
        node: target,
        candidate: {strategy: 'id', selector: ''},
        findElements,
        isCurrent: () => true,
      }),
    ).rejects.toMatchObject({code: 'INVALID_CANDIDATE'});
    await expect(
      verifyExplorerCandidate({
        node: {},
        candidate: proposed,
        findElements,
        isCurrent: () => true,
      }),
    ).rejects.toMatchObject({code: 'INVALID_REFERENCE'});
    await expect(
      verifyExplorerCandidate({
        node: target,
        candidate: proposed,
        findElements,
      }),
    ).rejects.toMatchObject({code: 'STALE_SNAPSHOT'});
    expect(findElements).not.toHaveBeenCalled();
  });
});
