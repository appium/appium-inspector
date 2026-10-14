import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {beforeEach, describe, expect, it, vi} from 'vitest';

const {rendered} = vi.hoisted(() => ({rendered: {autoCompletes: []}}));

const Passthrough = ({children}) => children ?? null;
vi.mock('antd', () => {
  const Splitter = Passthrough;
  Splitter.Panel = Passthrough;
  const Space = Passthrough;
  Space.Compact = Passthrough;
  Space.Addon = Passthrough;
  return {
    AutoComplete: (props) => {
      rendered.autoCompletes.push(props);
      return props.children;
    },
    Button: () => null,
    Checkbox: () => null,
    Col: Passthrough,
    Form: Object.assign(Passthrough, {Item: Passthrough}),
    Input: () => null,
    Modal: () => null,
    Row: Passthrough,
    Select: () => null,
    Space,
    Splitter,
    Tooltip: Passthrough,
  };
});
vi.mock('react-i18next', () => ({useTranslation: () => ({t: (key) => key})}));
vi.mock('../../app/common/renderer/components/SessionBuilder/CapabilityJSON/CapabilityJSON.jsx', () => ({
  default: () => null,
}));
vi.mock('../../app/common/renderer/components/SessionBuilder/CapabilityBuilderTab/CapabilityControl.jsx', () => ({
  default: () => null,
}));

const renderEditor = async (caps) => {
  const {default: CapabilityEditor} =
    await import('../../app/common/renderer/components/SessionBuilder/CapabilityBuilderTab/CapabilityEditor.jsx');
  const setCapabilityParam = vi.fn();
  renderToStaticMarkup(createElement(CapabilityEditor, {caps, setCapabilityParam, isEditingDesiredCaps: false}));
  return setCapabilityParam;
};

describe('Capability name suggestions', () => {
  beforeEach(() => {
    rendered.autoCompletes = [];
  });

  it('offers suggestions for the selected platform in each name field', async () => {
    await renderEditor([
      {id: 'a', name: 'platformName', value: 'iOS', type: 'text', enabled: true},
      {id: 'b', name: 'bundle', type: 'text', enabled: true},
    ]);
    expect(rendered.autoCompletes).toHaveLength(2);
    expect(rendered.autoCompletes[1].value).toBe('bundle');
    expect(rendered.autoCompletes[1].options.map(({value}) => value)).toEqual([
      'appium:bundleId',
      'appium:updatedWDABundleId',
    ]);
  });

  it('sets the name and adjusts the type of an empty capability on selection', async () => {
    const cap = {id: 'b', name: 'noRes', type: 'text', enabled: true};
    const setCapabilityParam = await renderEditor([cap]);
    const {onSelect, options} = rendered.autoCompletes[0];
    onSelect(options[0].value, options[0]);

    expect(setCapabilityParam.mock.calls).toEqual([
      ['b', 'name', 'appium:noReset'],
      ['b', 'type', 'boolean'],
      ['b', 'value', false],
    ]);
  });

  it('keeps the type of a capability that already has a value', async () => {
    const cap = {id: 'b', name: 'newCommand', value: 'abc', type: 'text', enabled: true};
    const setCapabilityParam = await renderEditor([cap]);
    const {onSelect, options} = rendered.autoCompletes[0];
    onSelect(options[0].value, options[0]);

    expect(setCapabilityParam.mock.calls).toEqual([['b', 'name', 'appium:newCommandTimeout']]);
  });
});
