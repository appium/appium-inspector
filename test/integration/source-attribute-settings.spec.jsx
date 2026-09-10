import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {beforeEach, describe, expect, it, vi} from 'vitest';

const {savedSettings, rendered} = vi.hoisted(() => ({
  savedSettings: new Map(),
  rendered: {actions: null, tree: null},
}));

vi.mock('#local-polyfills', () => ({
  settings: {
    has: (key) => savedSettings.has(key),
    get: (key) => savedSettings.get(key),
    set: (key, value) => savedSettings.set(key, value),
  },
}));
vi.mock('antd', () => ({Spin: ({children}) => children, Tree: () => null}));
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

const settingKey = 'IMPORTANT_SOURCE_ATTRIBUTES';
const sourceJSON = {
  children: [{tagName: 'Input', path: '/Input', attributes: {text: 'Email', hint: 'Enter email'}}],
};

const loadWrapper = async () =>
  (await import('../../app/common/renderer/components/SessionInspector/SourceTab/AppSource/AppSourceTreeWrapper.jsx'))
    .default;

const renderSession = (Wrapper) => renderToStaticMarkup(createElement(Wrapper, {sourceJSON, expandedPaths: []}));
const renderedNode = () => renderToStaticMarkup(rendered.tree.treeData[0].title);

describe('Saved source attribute settings', () => {
  beforeEach(() => {
    vi.resetModules();
    savedSettings.clear();
    rendered.actions = null;
    rendered.tree = null;
  });

  it('initializes the first session from the shared defaults', async () => {
    const {DEFAULT_SETTINGS, IMPORTANT_SOURCE_ATTRS} = await import('../../app/common/shared/setting-defs.js');
    renderSession(await loadWrapper());

    expect(rendered.actions.importantAttrs).toEqual(IMPORTANT_SOURCE_ATTRS);
    expect(DEFAULT_SETTINGS[settingKey]).toBe(IMPORTANT_SOURCE_ATTRS);
    expect(renderedNode()).toContain('Email');
    expect(renderedNode()).not.toContain('Enter email');
  });

  it('loads saved attributes before rendering the first session', async () => {
    savedSettings.set(settingKey, ['hint', 'text']);
    renderSession(await loadWrapper());

    expect(rendered.actions.importantAttrs).toEqual(['hint', 'text']);
    expect(renderedNode()).toContain('Enter email');
  });

  it('keeps edited attributes when a new inspector session mounts in the same renderer', async () => {
    const Wrapper = await loadWrapper();
    renderSession(Wrapper);
    const selection = ['text', 'hint'];
    await rendered.actions.updateImportantAttrs(selection);
    renderSession(Wrapper);

    expect(rendered.actions.importantAttrs).toEqual(['hint', 'text']);
    expect(savedSettings.get(settingKey)).toEqual(['hint', 'text']);
    expect(selection).toEqual(['text', 'hint']);
    expect(renderedNode()).toContain('Enter email');
  });

  it('preserves an empty selection after a new session and after reloading settings', async () => {
    const Wrapper = await loadWrapper();
    renderSession(Wrapper);
    await rendered.actions.updateImportantAttrs([]);
    renderSession(Wrapper);
    expect(rendered.actions.importantAttrs).toEqual([]);

    vi.resetModules();
    renderSession(await loadWrapper());
    expect(rendered.actions.importantAttrs).toEqual([]);
    expect(savedSettings.get(settingKey)).toEqual([]);
    expect(renderedNode()).not.toContain('Email');
    expect(renderedNode()).not.toContain('Enter email');
  });

  it('can restore the shared defaults after customization', async () => {
    savedSettings.set(settingKey, ['hint']);
    const {IMPORTANT_SOURCE_ATTRS} = await import('../../app/common/shared/setting-defs.js');
    const Wrapper = await loadWrapper();
    renderSession(Wrapper);
    await rendered.actions.updateImportantAttrs(IMPORTANT_SOURCE_ATTRS);
    renderSession(Wrapper);

    expect(rendered.actions.importantAttrs).toEqual(IMPORTANT_SOURCE_ATTRS);
    expect(savedSettings.get(settingKey)).toEqual(IMPORTANT_SOURCE_ATTRS);
    expect(renderedNode()).toContain('Email');
    expect(renderedNode()).not.toContain('Enter email');
  });
});
