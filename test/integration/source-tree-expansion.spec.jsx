import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {beforeEach, describe, expect, it, vi} from 'vitest';

const {rendered} = vi.hoisted(() => ({rendered: {tree: null}}));

vi.mock('antd', () => ({
  Tree: (props) => {
    rendered.tree = props;
    return null;
  },
}));

import AppSourceTree from '../../app/common/renderer/components/SessionInspector/SourceTab/AppSource/AppSourceTree.jsx';

describe('Source tree normal expansion and selection', () => {
  beforeEach(() => {
    rendered.tree = null;
  });

  const renderTree = (props = {}) => {
    const callbacks = {expandNode: vi.fn(), selectElement: vi.fn(), unselectElement: vi.fn()};
    renderToStaticMarkup(createElement(AppSourceTree, {...callbacks, expandedKeys: ['other'], ...props}));
    return callbacks;
  };

  it('forwards ordinary expansion and collapse with the clicked node metadata', () => {
    const callbacks = renderTree();
    const node = {key: 'target', children: [{key: 'child'}]};
    rendered.tree.onExpand(['other', 'target'], {expanded: true, node});
    rendered.tree.onExpand(['other'], {expanded: false, node});
    expect(callbacks.expandNode.mock.calls).toEqual([
      [['other', 'target'], {expanded: true, node}],
      [['other'], {expanded: false, node}],
    ]);
    expect(callbacks.selectElement).not.toHaveBeenCalled();
    expect(callbacks.unselectElement).not.toHaveBeenCalled();
  });

  it('keeps selecting and unselecting elements separate from expansion', () => {
    const callbacks = renderTree({selectedElementPath: 'other'});
    expect(rendered.tree.selectedKeys).toEqual(['other']);
    rendered.tree.onSelect(['target']);
    rendered.tree.onSelect([]);
    expect(callbacks.selectElement).toHaveBeenCalledExactlyOnceWith('target');
    expect(callbacks.unselectElement).toHaveBeenCalledOnce();
    expect(callbacks.expandNode).not.toHaveBeenCalled();
  });

  it('uses normal node titles without a right-click menu', () => {
    const treeData = [{key: 'target', title: 'Container', children: [{key: 'leaf', title: 'Button'}]}];
    renderTree({treeData});
    expect(rendered.tree.treeData).toBe(treeData);
    expect(rendered.tree.titleRender).toBeUndefined();
  });
});
