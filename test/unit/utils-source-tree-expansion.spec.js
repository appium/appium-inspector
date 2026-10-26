import {describe, expect, it} from 'vitest';

import {expandSourceBranch, SOURCE_EXPANSION_LIMIT} from '../../app/common/renderer/utils/source-tree-expansion.js';

const branch = (key, children = []) => ({key, children});
const chain = (depth) => {
  let node = branch(String(depth));
  for (let level = depth - 1; level >= 0; level--) {
    node = branch(String(level), [node]);
  }
  return node;
};

describe('Bounded source tree expansion', () => {
  it('opens three collapsed levels without adding leaf keys', () => {
    const tree = branch('root', [branch('left', [branch('leaf')]), branch('right', [chain(5)])]);
    expect(expandSourceBranch(tree, [])).toEqual(['root', 'left', 'right', '0']);
  });

  it('continues from the next collapsed level when invoked again', () => {
    const tree = chain(9);
    const first = expandSourceBranch(tree, []);
    expect(first).toEqual(['0', '1', '2']);
    const second = expandSourceBranch(tree, first);
    expect(second).toEqual(['0', '1', '2', '3', '4', '5']);
    expect(expandSourceBranch(tree, second)).toEqual(['0', '1', '2', '3', '4', '5', '6', '7', '8']);
  });

  it('does not spend its depth allowance on already expanded levels', () => {
    expect(expandSourceBranch(chain(9), ['0', '1', '2', '3'])).toEqual(['0', '1', '2', '3', '4', '5', '6']);
  });

  it('preserves other branches and does not mutate the previous expansion array', () => {
    const paths = Object.freeze(['other', 'other/child']);
    expect(expandSourceBranch(chain(4), paths)).toEqual(['other', 'other/child', '0', '1', '2']);
    expect(paths).toEqual(['other', 'other/child']);
  });

  it('starts at the shallowest collapsed frontier across uneven branches', () => {
    const tree = branch('root', [
      branch('left', [branch('left/1', [branch('left/2', [branch('left/3', [branch('left/4')])])])]),
      branch('right', [branch('right/1', [branch('right/2', [branch('right/3')])])]),
    ]);
    const result = expandSourceBranch(tree, ['root', 'left', 'left/1']);
    expect(result).toContain('right');
    expect(result).toContain('right/2');
    expect(result).toContain('left/2');
    expect(result).not.toContain('left/3');
  });

  it('limits newly opened branches and makes progress on a wide tree on later clicks', () => {
    const tree = branch(
      'root',
      Array.from({length: 300}, (_, i) => branch(`child/${i}`, [branch(`leaf/${i}`)])),
    );
    const first = expandSourceBranch(tree, []);
    expect(first).toHaveLength(SOURCE_EXPANSION_LIMIT);
    expect(first).toContain('root');
    expect(first).toContain('child/48');
    expect(first).not.toContain('child/49');
    const second = expandSourceBranch(tree, first);
    expect(second.length - first.length).toBe(SOURCE_EXPANSION_LIMIT);
    expect(second).toContain('child/49');
    expect(second).not.toContain('leaf/0');
    let complete = second;
    for (let i = 0; i < 6; i++) {
      complete = expandSourceBranch(tree, complete);
    }
    expect(complete).toHaveLength(301);
    expect(new Set(complete).size).toBe(301);
  });

  it('counts only new keys toward the limit', () => {
    const existing = Array.from({length: 200}, (_, i) => `elsewhere/${i}`);
    expect(expandSourceBranch(chain(5), existing)).toHaveLength(203);
  });

  it('handles leaves, empty source and fully expanded trees without changes', () => {
    expect(expandSourceBranch(branch('leaf'), [])).toEqual([]);
    expect(expandSourceBranch(null, ['existing'])).toEqual(['existing']);
    expect(expandSourceBranch(chain(3), ['0', '1', '2'])).toEqual(['0', '1', '2']);
  });

  it('traverses an already expanded deep chain without recursive calls', () => {
    const existing = Array.from({length: 4000}, (_, i) => String(i));
    const result = expandSourceBranch(chain(4005), existing);
    expect(result.slice(-3)).toEqual(['4000', '4001', '4002']);
  });
});
