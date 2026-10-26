import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {beforeEach, describe, expect, it, vi} from 'vitest';

const {savedSettings, rendered} = vi.hoisted(() => ({
  savedSettings: new Map(),
  rendered: {actions: null, tree: null, selects: []},
}));

vi.mock('#local-polyfills', () => ({
  settings: {
    has: (key) => savedSettings.has(key),
    get: (key) => savedSettings.get(key),
    set: (key, value) => savedSettings.set(key, value),
  },
}));
vi.mock('antd', () => ({
  Spin: ({children}) => children,
  Tree: () => null,
  Button: ({children}) => children,
  Tooltip: ({children}) => children,
  Modal: ({children}) => children,
  Space: ({children}) => children,
  Select: (props) => {
    rendered.selects.push(props);
    return null;
  },
}));
vi.mock('react-i18next', () => ({useTranslation: () => ({t: (key) => key})}));
vi.mock('../../app/common/renderer/components/SessionInspector/SourceTab/AppSource/AppSourceTreeActions.jsx', () => ({
  default: (props) => {
    rendered.actions = props;
    return null;
  },
}));
vi.mock('../../app/common/renderer/components/SessionInspector/SourceTab/AppSource/AppSourceTree.jsx', () => ({
  default: (props) => {
    rendered.tree = props;
    return null;
  },
}));

const settingKey = 'SOURCE_EXPANSION_DEPTH';
const sourceJSON = {children: [{tagName: 'Root', path: 'root', attributes: {text: 'Root'}, children: []}]};
const node = {key: 'root', children: [{key: 'child', children: [{key: 'grandchild', children: [{key: 'leaf'}]}]}]};
const loadWrapper = async () =>
  (await import('../../app/common/renderer/components/SessionInspector/SourceTab/AppSource/AppSourceTreeWrapper.jsx'))
    .default;
const renderSession = (Wrapper, props = {}) =>
  renderToStaticMarkup(createElement(Wrapper, {sourceJSON, expandedPaths: ['other'], ...props}));

describe('Persistent source expansion settings', () => {
  beforeEach(() => {
    vi.resetModules();
    savedSettings.clear();
    rendered.actions = null;
    rendered.tree = null;
    rendered.selects = [];
  });

  it('defaults to one level using the shared setting default', async () => {
    const {DEFAULT_SETTINGS} = await import('../../app/common/shared/setting-defs.js');
    const setExpandedPaths = vi.fn();
    renderSession(await loadWrapper(), {setExpandedPaths});
    expect(DEFAULT_SETTINGS[settingKey]).toBe(1);
    expect(rendered.actions.expansionDepth).toBe(1);
    rendered.tree.expandNode(['other', 'root'], {expanded: true, node});
    expect(setExpandedPaths).toHaveBeenCalledExactlyOnceWith(['other', 'root']);
  });

  it('loads a saved depth and applies it only to ordinary expansion', async () => {
    savedSettings.set(settingKey, 3);
    const setExpandedPaths = vi.fn();
    renderSession(await loadWrapper(), {setExpandedPaths});
    expect(rendered.actions.expansionDepth).toBe(3);
    rendered.tree.expandNode(['other', 'root'], {expanded: true, node});
    rendered.tree.expandNode(['other', 'child'], {expanded: false, node});
    expect(setExpandedPaths.mock.calls).toEqual([[['other', 'root', 'child', 'grandchild']], [['other', 'child']]]);
  });

  it('saves changes without changing current paths and retains them on remount and reload', async () => {
    const Wrapper = await loadWrapper();
    const setExpandedPaths = vi.fn();
    renderSession(Wrapper, {setExpandedPaths});
    await rendered.actions.updateExpansionDepth(10);
    expect(setExpandedPaths).not.toHaveBeenCalled();
    expect(savedSettings.get(settingKey)).toBe(10);
    renderSession(Wrapper);
    expect(rendered.actions.expansionDepth).toBe(10);
    vi.resetModules();
    renderSession(await loadWrapper());
    expect(rendered.actions.expansionDepth).toBe(10);
  });

  it('uses the safe default for invalid persisted values and invalid updates', async () => {
    savedSettings.set(settingKey, 100);
    renderSession(await loadWrapper());
    expect(rendered.actions.expansionDepth).toBe(1);
    await rendered.actions.updateExpansionDepth(null);
    expect(savedSettings.get(settingKey)).toBe(1);
  });

  it('keeps the attribute preference independent from expansion depth', async () => {
    savedSettings.set('IMPORTANT_SOURCE_ATTRIBUTES', ['hint']);
    const Wrapper = await loadWrapper();
    renderSession(Wrapper);
    await rendered.actions.updateExpansionDepth(4);
    await rendered.actions.updateImportantAttrs(['text']);
    renderSession(Wrapper);
    expect(savedSettings.get(settingKey)).toBe(4);
    expect(rendered.actions.expansionDepth).toBe(4);
    expect(rendered.actions.importantAttrs).toEqual(['text']);
  });

  it('exposes all supported depths separately from the existing attribute controls', async () => {
    const SourceSettings = (
      await import('../../app/common/renderer/components/SessionInspector/SourceTab/AppSource/SourceSettings.jsx')
    ).default;
    const updateExpansionDepth = vi.fn();
    const updateImportantAttrs = vi.fn();
    renderToStaticMarkup(
      createElement(SourceSettings, {
        importantAttrs: ['text'],
        expansionDepth: 7,
        updateExpansionDepth,
        updateImportantAttrs,
      }),
    );
    const depth = rendered.selects.find((select) => select.id === 'sourceExpansionDepth');
    const attributes = rendered.selects.find((select) => select.mode === 'tags');
    expect(depth.value).toBe(7);
    expect(depth.options.map(({value}) => value)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    depth.onChange(10);
    attributes.onChange(['hint']);
    expect(updateExpansionDepth).toHaveBeenCalledExactlyOnceWith(10);
    expect(updateImportantAttrs).toHaveBeenCalledExactlyOnceWith(['hint']);
  });
});
