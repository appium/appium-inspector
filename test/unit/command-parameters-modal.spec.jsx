import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {beforeEach, describe, expect, it, vi} from 'vitest';

const {rendered} = vi.hoisted(() => ({
  rendered: {autoComplete: null, input: null},
}));

vi.mock('antd', () => ({
  AutoComplete: (props) => {
    rendered.autoComplete = props;
    return null;
  },
  Input: (props) => {
    rendered.input = props;
    return null;
  },
  Modal: ({children}) => children,
  Space: {
    Compact: ({children}) => children,
    Addon: ({children}) => children,
  },
  Typography: {
    Text: ({children}) => children,
  },
}));
vi.mock('react-i18next', () => ({useTranslation: () => ({t: (key) => key})}));

import CommandParametersModal from '../../app/common/renderer/components/SessionInspector/CommandsTab/CommandParametersModal.jsx';

describe('CommandParametersModal', () => {
  beforeEach(() => {
    rendered.autoComplete = null;
    rendered.input = null;
  });

  it('should render AutoComplete with windowHandles options for switchToWindow', () => {
    const curCommandParamValsRef = {current: []};
    renderToStaticMarkup(
      createElement(CommandParametersModal, {
        curCommandDetails: {
          name: 'switchToWindow',
          details: {params: [{name: 'handle', required: true}]},
        },
        curCommandParamValsRef,
        windowHandles: ['CDwindow-1', 'CDwindow-2'],
        prepareAndRunCommand: vi.fn(),
        clearCurrentCommand: vi.fn(),
      }),
    );

    expect(rendered.autoComplete).not.toBeNull();
    expect(rendered.input).toBeNull();
    expect(rendered.autoComplete.options).toEqual([
      {value: 'CDwindow-1', label: 'CDwindow-1'},
      {value: 'CDwindow-2', label: 'CDwindow-2'},
    ]);

    rendered.autoComplete.onChange('CDwindow-2');
    expect(curCommandParamValsRef.current[0]).toBe('CDwindow-2');
  });

  it('should render standard Input when windowHandles is empty or for other commands', () => {
    const curCommandParamValsRef = {current: []};
    renderToStaticMarkup(
      createElement(CommandParametersModal, {
        curCommandDetails: {
          name: 'navigateTo',
          details: {params: [{name: 'url', required: true}]},
        },
        curCommandParamValsRef,
        windowHandles: ['CDwindow-1'],
        prepareAndRunCommand: vi.fn(),
        clearCurrentCommand: vi.fn(),
      }),
    );

    expect(rendered.input).not.toBeNull();
    expect(rendered.autoComplete).toBeNull();

    rendered.input.onChange({target: {value: 'https://appium.io'}});
    expect(curCommandParamValsRef.current[0]).toBe('https://appium.io');
  });
});
