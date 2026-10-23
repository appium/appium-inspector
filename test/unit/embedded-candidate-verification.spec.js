import {describe, expect, it, vi} from 'vitest';

import {
  MAX_VERIFIED_LOCATOR_CANDIDATES,
  normalizeLocatorIdentity,
  prepareLocatorCandidates,
  verifyLocatorCandidates,
} from '../../app/common/renderer/embedded/candidate-verification.js';

const candidates = [
  {
    id: 'id-login',
    strategy: 'id',
    selector: 'login',
    priority: 10,
    unique: true,
    reason: 'Direct Android resource identifier',
  },
  {
    id: 'xpath-text',
    strategy: 'xpath',
    selector: '//*[@text="Log in"]',
    priority: 70,
    unique: true,
    reason: 'Exact visible text',
  },
  {
    id: 'class-button',
    strategy: 'class name',
    selector: 'android.widget.Button',
    priority: 55,
    unique: false,
    reason: 'Android widget class',
  },
  {
    id: 'xpath-structural',
    strategy: 'xpath',
    selector: '//android.widget.Button[1]',
    priority: 1000,
    unique: true,
    structural: true,
    reason: 'Structural source-tree fallback',
  },
];

describe('embedded locator candidate verification', function () {
  it('normalizes, deduplicates, and deterministically orders candidates with the primary exactly once', function () {
    const prepared = prepareLocatorCandidates({strategy: ' ID ', selector: ' login '}, [
      {},
      ...candidates,
      {...candidates[0], id: 'duplicate-id', strategy: 'id', selector: 'login '},
      {
        ...candidates[2],
        id: 'xpath-text',
        strategy: 'accessibility id',
        selector: 'Log in',
      },
    ]);

    expect(normalizeLocatorIdentity(' ID ', ' login ')).toBe('id\0login');
    expect(prepared.map(({candidateId}) => candidateId)).toEqual([
      'id-login',
      'xpath-text',
      expect.stringMatching(/^accessibility-id-/),
      'class-button',
      'xpath-structural',
    ]);
    expect(prepared[0]).toMatchObject({strategy: 'ID', selector: 'login', stability: 'stable'});
  });

  it('includes a manually edited primary with a stable ID and compact metadata', function () {
    const first = prepareLocatorCandidates({strategy: 'xpath', selector: '//*[@enabled="true"]'}, candidates);
    const second = prepareLocatorCandidates({strategy: 'xpath', selector: '//*[@enabled="true"]'}, candidates);

    expect(first[0]).toEqual({
      candidateId: second[0].candidateId,
      strategy: 'xpath',
      selector: '//*[@enabled="true"]',
      priority: 0,
      stability: 'manual',
      sourceReason: 'Manual Inspector selection',
    });
    expect(first.filter(({selector}) => selector === '//*[@enabled="true"]')).toHaveLength(1);
  });

  it('requires exact-one same-element verification and omits failed, multiple, and different alternatives', async function () {
    const lookupResults = new Map([
      ['id\0login', ['selected-element']],
      ['xpath\0//*[@text="Log in"]', ['selected-element']],
      ['class name\0android.widget.Button', ['selected-element', 'other-element']],
      ['xpath\0//android.widget.Button[1]', ['other-element']],
    ]);
    const onAlternativeError = vi.fn();
    const verified = await verifyLocatorCandidates({
      primary: {strategy: 'id', selector: 'login'},
      proposedCandidates: [
        ...candidates,
        {
          id: 'bad-xpath',
          strategy: 'xpath',
          selector: '//*[',
          priority: 90,
          unique: null,
          reason: 'Malformed test candidate',
        },
      ],
      selectedElementId: 'selected-element',
      findElements: vi.fn(async ({strategy, selector}) => {
        if (selector === '//*[') {
          throw new Error('Invalid selector');
        }
        return lookupResults.get(normalizeLocatorIdentity(strategy, selector));
      }),
      onAlternativeError,
    });

    expect(verified.map(({candidateId}) => candidateId)).toEqual(['id-login', 'xpath-text']);
    expect(verified).toEqual(expect.arrayContaining([expect.objectContaining({matchCount: 1, sameElement: true})]));
    expect(onAlternativeError).toHaveBeenCalledWith(
      expect.objectContaining({candidateId: 'bad-xpath'}),
      expect.any(Error),
    );
  });

  it.each([
    [[], 'PRIMARY_NOT_EXACT'],
    [['selected-element', 'other-element'], 'PRIMARY_NOT_EXACT'],
    [['other-element'], 'PRIMARY_DIFFERENT_ELEMENT'],
  ])('blocks an invalid primary result %#', async function (matches, code) {
    await expect(
      verifyLocatorCandidates({
        primary: {strategy: 'id', selector: 'login'},
        proposedCandidates: candidates,
        selectedElementId: 'selected-element',
        findElements: vi.fn().mockResolvedValue(matches),
      }),
    ).rejects.toMatchObject({code});
  });

  it('requires confirmation before adopting the unique element found by a manual locator', async function () {
    const findElements = vi.fn().mockResolvedValue(['manual-target']);
    const input = {
      primary: {strategy: 'xpath', selector: '//*[@content-desc="Manual target"]'},
      proposedCandidates: candidates,
      selectedElementId: 'selected-element',
      findElements,
    };

    await expect(verifyLocatorCandidates(input)).rejects.toMatchObject({
      code: 'MANUAL_ELEMENT_CONFIRMATION_REQUIRED',
      selectedElementId: 'selected-element',
      matchedElementId: 'manual-target',
    });

    const verified = await verifyLocatorCandidates({...input, adoptedElementId: 'manual-target'});
    expect(verified[0]).toMatchObject({
      stability: 'manual',
      matchCount: 1,
      sameElement: true,
    });
  });

  it('rejects adoption when the manual locator no longer finds the confirmed element', async function () {
    await expect(
      verifyLocatorCandidates({
        primary: {strategy: 'xpath', selector: '//*[@content-desc="Manual target"]'},
        proposedCandidates: candidates,
        selectedElementId: 'selected-element',
        adoptedElementId: 'previous-target',
        findElements: vi.fn().mockResolvedValue(['new-target']),
      }),
    ).rejects.toMatchObject({code: 'PRIMARY_DIFFERENT_ELEMENT'});
  });

  it('blocks primary execution failures and unresolved selected elements', async function () {
    await expect(
      verifyLocatorCandidates({
        primary: {strategy: 'id', selector: 'login'},
        proposedCandidates: candidates,
        selectedElementId: 'selected-element',
        findElements: vi.fn().mockRejectedValue(new Error('Appium unavailable')),
      }),
    ).rejects.toMatchObject({code: 'PRIMARY_LOOKUP_FAILED'});
    await expect(
      verifyLocatorCandidates({
        primary: {strategy: 'id', selector: 'login'},
        proposedCandidates: candidates,
        selectedElementId: null,
        findElements: vi.fn(),
      }),
    ).rejects.toMatchObject({code: 'SELECTED_ELEMENT_UNRESOLVED'});
  });

  it('applies the documented deterministic safety limit', function () {
    const manyCandidates = Array.from({length: MAX_VERIFIED_LOCATOR_CANDIDATES + 10}, (_, index) => ({
      id: `candidate-${index}`,
      strategy: 'xpath',
      selector: `//*[@index="${index}"]`,
      priority: index,
      unique: true,
      reason: 'Test candidate',
    }));

    expect(prepareLocatorCandidates({strategy: 'id', selector: 'primary'}, manyCandidates)).toHaveLength(
      MAX_VERIFIED_LOCATOR_CANDIDATES,
    );
  });
});
