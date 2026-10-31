import {describe, expect, it} from 'vitest';

import {
  expandSourceBranch,
  normalizeSourceExpansionDepth,
} from '../../app/common/renderer/utils/source-tree-expansion.js';

const branch = (key, children = []) => ({key, children});
const chain = (depth) => {
  let node = branch(String(depth));
  for (let level = depth - 1; level >= 0; level--) {
    node = branch(String(level), [node]);
  }
  return node;
};

describe('Configured source tree expansion', () => {
  it('defaults to the normal one-level expansion', () => {
    expect(expandSourceBranch(chain(12), [])).toEqual(['0']);
  });

  it.each([1, 3, 10])('opens exactly %i levels from the clicked node', (depth) => {
    expect(expandSourceBranch(chain(12), [], depth)).toEqual(Array.from({length: depth}, (_, index) => String(index)));
  });

  it('counts depth from the clicked node even when some descendants are already open', () => {
    expect(expandSourceBranch(chain(9), ['other', '0', '1'], 3)).toEqual(['other', '0', '1', '2']);
    expect(expandSourceBranch(chain(9), ['0', '1', '2'], 3)).toEqual(['0', '1', '2']);
  });

  it('preserves unrelated branches and does not mutate the previous expansion array', () => {
    const paths = Object.freeze(['other', 'other/child']);
    expect(expandSourceBranch(branch('target', [chain(4)]), paths, 2)).toEqual(['other', 'other/child', 'target', '0']);
    expect(paths).toEqual(['other', 'other/child']);
  });

  it('opens all branches within the chosen depth without adding leaf keys', () => {
    const tree = branch(
      'root',
      Array.from({length: 300}, (_, index) => branch('child/' + index, [branch('leaf/' + index)])),
    );
    const result = expandSourceBranch(tree, [], 2);
    expect(result).toHaveLength(301);
    expect(result).toEqual(['root', ...Array.from({length: 300}, (_, index) => 'child/' + index)]);
    expect(expandSourceBranch(tree, result, 2)).toEqual(result);
  });

  it('does not traverse beyond the requested depth', () => {
    const outsideDepth = {
      key: 'outside',
      get children() {
        throw new Error('must not traverse');
      },
    };
    expect(expandSourceBranch(branch('root', [branch('child', [outsideDepth])]), [], 2)).toEqual(['root', 'child']);
  });

  it('handles leaves and missing source without changing existing keys', () => {
    expect(expandSourceBranch(branch('leaf'), ['other'], 10)).toEqual(['other']);
    expect(expandSourceBranch(null, ['other'], 10)).toEqual(['other']);
  });

  it('bounds a deep chain without recursive calls', () => {
    expect(expandSourceBranch(chain(4000), [], 10)).toEqual(Array.from({length: 10}, (_, index) => String(index)));
  });

  it('accepts every supported integer depth', () => {
    for (let depth = 1; depth <= 10; depth++) {
      expect(normalizeSourceExpansionDepth(depth)).toBe(depth);
    }
  });

  it.each([undefined, null, 0, -1, 11, 1.5, NaN, Infinity, '3', true])(
    'falls back to one for invalid depth %s',
    (depth) => {
      expect(normalizeSourceExpansionDepth(depth)).toBe(1);
      expect(expandSourceBranch(chain(3), [], depth)).toEqual(['0']);
    },
  );
});
