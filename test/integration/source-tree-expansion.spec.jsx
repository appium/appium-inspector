import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {beforeEach, describe, expect, it, vi} from 'vitest';

const {rendered} = vi.hoisted(() => ({rendered: {tree: null, dropdown: null}}));

vi.mock('antd', () => ({
  Tree: (props) => {
    rendered.tree = props;
    return null;
  },
  Dropdown: (props) => {
    rendered.dropdown = props;
    return props.children;
  },
}));
vi.mock('react-i18next', () => ({useTranslation: () => ({t: (key) => key})}));

import AppSourceTree from '../../app/common/renderer/components/SessionInspector/SourceTab/AppSource/AppSourceTree.jsx';

describe('Source tree branch context menu', () => {
  beforeEach(() => {
    rendered.tree = null;
    rendered.dropdown = null;
  });

  const renderTree = (props = {}) => {
    const callbacks = {expandBranch: vi.fn(), selectElement: vi.fn(), unselectElement: vi.fn()};
    renderToStaticMarkup(createElement(AppSourceTree, {...callbacks, expandedKeys: ['other'], ...props}));
    return callbacks;
  };

  it('opens a branch menu without selecting or unselecting the target element', () => {
    const callbacks = renderTree({selectedElementPath: 'other'});
    const target = {key: 'target', title: 'Container', children: [{key: 'child', title: 'Button'}]};
    expect(rendered.tree.titleRender).toBeTypeOf('function');
    renderToStaticMarkup(rendered.tree.titleRender(target));

    expect(rendered.dropdown.trigger).toEqual(['contextMenu']);
    expect(rendered.dropdown.menu.items[0].disabled).toBe(false);
    expect(rendered.tree.selectedKeys).toEqual(['other']);
    expect(callbacks.selectElement).not.toHaveBeenCalled();
    expect(callbacks.unselectElement).not.toHaveBeenCalled();
  });

  it('sends the clicked branch to its expansion handler and stops click propagation', () => {
    const callbacks = renderTree();
    const target = {key: 'target', title: 'Container', children: [{key: 'child', title: 'Button'}]};
    expect(rendered.tree.titleRender).toBeTypeOf('function');
    renderToStaticMarkup(rendered.tree.titleRender(target));
    const stopPropagation = vi.fn();
    rendered.dropdown.menu.onClick({key: 'expandBranch', domEvent: {stopPropagation}});

    expect(callbacks.expandBranch).toHaveBeenCalledExactlyOnceWith(target);
    expect(stopPropagation).toHaveBeenCalledOnce();
    expect(callbacks.selectElement).not.toHaveBeenCalled();
    expect(callbacks.unselectElement).not.toHaveBeenCalled();
  });

  it('disables expansion for a leaf while preserving its rendered title', () => {
    renderTree();
    expect(rendered.tree.titleRender).toBeTypeOf('function');
    const html = renderToStaticMarkup(rendered.tree.titleRender({key: 'leaf', title: 'Button'}));
    expect(rendered.dropdown.menu.items[0].disabled).toBe(true);
    expect(html).toContain('Button');
  });
});
