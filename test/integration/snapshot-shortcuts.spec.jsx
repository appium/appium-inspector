import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

const {effects} = vi.hoisted(() => ({effects: []}));

vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal()),
  useEffect: (callback, dependencies) => effects.push({callback, dependencies}),
}));

import InspectorShortcuts from '../../app/common/renderer/components/SessionInspector/InspectorShortcuts.jsx';

const baseProps = () => ({
  isSnapshot: false,
  applyClientMethod: vi.fn(),
  showLocatorSearchModal: vi.fn(),
  isRecording: false,
  startRecording: vi.fn(),
  pauseRecording: vi.fn(),
});

const render = (props) => {
  effects.length = 0;
  const markup = renderToStaticMarkup(createElement(InspectorShortcuts, props, 'Inspector content'));
  expect(markup).toContain('Inspector content');
  expect(effects).toHaveLength(1);
  return effects[0];
};

const press = (code) => {
  const event = new Event('keydown', {cancelable: true});
  Object.assign(event, {code, ctrlKey: true, shiftKey: true});
  window.dispatchEvent(event);
  return event;
};

describe('Snapshot keyboard shortcut isolation', () => {
  beforeEach(() => vi.stubGlobal('window', new EventTarget()));
  afterEach(() => vi.unstubAllGlobals());

  it('does not install live shortcuts or consume keys for an offline snapshot', () => {
    const props = {...baseProps(), isSnapshot: true};
    const addListener = vi.spyOn(window, 'addEventListener');
    expect(render(props).callback()).toBeUndefined();

    for (const code of ['KeyR', 'KeyF', 'KeyV']) {
      expect(press(code).defaultPrevented).toBe(false);
    }
    expect(addListener).not.toHaveBeenCalled();
    for (const action of [
      props.applyClientMethod,
      props.showLocatorSearchModal,
      props.startRecording,
      props.pauseRecording,
    ]) {
      expect(action).not.toHaveBeenCalled();
    }
  });

  it.each([false, true])('preserves live refresh, search and recording shortcuts (recording: %s)', (isRecording) => {
    const props = {...baseProps(), isRecording};
    const cleanup = render(props).callback();

    for (const code of ['KeyR', 'KeyF', 'KeyV']) {
      expect(press(code).defaultPrevented).toBe(true);
    }
    expect(props.applyClientMethod).toHaveBeenCalledExactlyOnceWith({methodName: 'getPageSource'});
    expect(props.showLocatorSearchModal).toHaveBeenCalledOnce();
    expect(isRecording ? props.pauseRecording : props.startRecording).toHaveBeenCalledOnce();
    expect(isRecording ? props.startRecording : props.pauseRecording).not.toHaveBeenCalled();
    cleanup();
    expect(press('KeyR').defaultPrevented).toBe(false);
    expect(props.applyClientMethod).toHaveBeenCalledOnce();
  });

  it('cleans up live shortcuts on a snapshot transition and installs them once on return', () => {
    const props = baseProps();
    const liveEffect = render(props);
    const cleanup = liveEffect.callback();
    expect(press('KeyF').defaultPrevented).toBe(true);

    const snapshotEffect = render({...props, isSnapshot: true});
    expect(snapshotEffect.dependencies).not.toEqual(liveEffect.dependencies);
    cleanup();
    expect(snapshotEffect.callback()).toBeUndefined();
    expect(press('KeyF').defaultPrevented).toBe(false);
    expect(props.showLocatorSearchModal).toHaveBeenCalledOnce();

    const cleanupRestored = render(props).callback();
    expect(press('KeyF').defaultPrevented).toBe(true);
    expect(props.showLocatorSearchModal).toHaveBeenCalledTimes(2);
    cleanupRestored();
    expect(press('KeyF').defaultPrevented).toBe(false);
  });
});
