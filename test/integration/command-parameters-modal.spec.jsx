import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {beforeEach, describe, expect, it, vi} from 'vitest';

import CommandParametersModal from '../../app/common/renderer/components/SessionInspector/CommandsTab/CommandParametersModal.jsx';
import {adjustCommandParamValueType} from '../../app/common/renderer/utils/commands-tab.js';

const {rendered} = vi.hoisted(() => ({rendered: {inputs: [], modal: null}}));

vi.mock('antd', () => ({
  AutoComplete: (props) => {
    rendered.inputs.push({type: 'autocomplete', props});
    return null;
  },
  Input: (props) => {
    rendered.inputs.push({type: 'input', props});
    return null;
  },
  Modal: (props) => {
    rendered.modal = props;
    return props.children;
  },
  Space: {Compact: ({children}) => children, Addon: ({children}) => children},
  Typography: {Text: ({children}) => children},
}));
vi.mock('react-i18next', () => ({useTranslation: () => ({t: (key) => key})}));

const renderModal = (name = 'switchToWindow', isExecute = false) => {
  const props = {
    curCommandDetails: {name, isExecute, details: {params: [{name: 'handle', required: true}]}},
    curCommandParamValsRef: {current: []},
    prepareAndRunCommand: vi.fn(),
    clearCurrentCommand: vi.fn(),
    getWindowHandles: vi.fn(),
  };
  renderToStaticMarkup(createElement(CommandParametersModal, props));
  return props;
};

describe('Command parameter inputs', () => {
  beforeEach(() => {
    rendered.inputs = [];
    rendered.modal = null;
  });

  it('allows both selected and manually entered window handles without type conversion', () => {
    const props = renderModal();
    const input = rendered.inputs[0];
    expect(input.type).toBe('autocomplete');
    expect(input.props.disabled).toBeUndefined();
    for (const value of ['window-1', '123', 'true', 'null', '[1,2]', 'unlisted-handle']) {
      input.props.onChange(value);
      expect(props.curCommandParamValsRef.current).toEqual([value]);
      expect(adjustCommandParamValueType(value, props.curCommandDetails, {name: 'handle'})).toBe(value);
    }
    rendered.modal.onOk();
    expect(props.prepareAndRunCommand).toHaveBeenCalledWith(props.curCommandDetails);
  });

  it('keeps normal command inputs and parameter conversion unchanged', () => {
    const props = renderModal('otherCommand');
    const input = rendered.inputs[0];
    expect(input.type).toBe('input');
    input.props.onChange({target: {value: '123'}});
    expect(props.curCommandParamValsRef.current).toEqual(['123']);
    expect(adjustCommandParamValueType('123', props.curCommandDetails, {name: 'handle'})).toBe(123);
  });

  it('does not special-case an execute method with the same name', () => {
    const props = renderModal('switchToWindow', true);
    expect(rendered.inputs[0].type).toBe('input');
    expect(adjustCommandParamValueType('true', props.curCommandDetails, {name: 'handle'})).toBe(true);
  });

  it('preserves the modal cancellation handler', () => {
    const props = renderModal();
    rendered.modal.onCancel();
    expect(props.clearCurrentCommand).toHaveBeenCalledOnce();
    expect(props.prepareAndRunCommand).not.toHaveBeenCalled();
  });
});
