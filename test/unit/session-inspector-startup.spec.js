import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {beforeEach, describe, expect, it, vi} from 'vitest';

const {lifecycle, actions, navigate} = vi.hoisted(() => ({
  lifecycle: {refs: [], refIndex: 0, effect: null, previousEffect: null, inspector: {}, header: null},
  actions: {
    applyClientMethod: vi.fn(),
    storeSessionSettings: vi.fn(),
    getSavedClientFramework: vi.fn(),
    runKeepAliveLoop: vi.fn(),
    setSessionTime: vi.fn(),
    quitSession: vi.fn(),
  },
  navigate: vi.fn(),
}));

// Preserve the component's refs and run changed effects across server renders, without a DOM.
vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal()),
  useRef: (initialValue) => {
    const index = lifecycle.refIndex++;
    lifecycle.refs[index] ??= {current: initialValue};
    return lifecycle.refs[index];
  },
  useEffect: (callback, dependencies) => {
    lifecycle.effect = {callback, dependencies};
  },
}));
vi.mock('@reduxjs/toolkit', () => ({bindActionCreators: () => actions}));
vi.mock('react-redux', () => ({
  shallowEqual: () => true,
  useDispatch: () => vi.fn(),
  useSelector: (select) => select({inspector: lifecycle.inspector}),
}));
vi.mock('react-router', () => ({useNavigate: () => navigate}));
vi.mock('react-i18next', () => ({useTranslation: () => ({t: (key) => key})}));
vi.mock('../../app/common/renderer/actions/SessionInspector.js', () => ({}));
vi.mock('antd', () => {
  const Passthrough = ({children}) => children ?? null;
  return {Alert: () => null, Splitter: Object.assign(Passthrough, {Panel: Passthrough})};
});
vi.mock('../../app/common/renderer/components/SessionInspector/Header/HeaderButtons.jsx', () => ({
  default: (props) => {
    lifecycle.header = props;
    return null;
  },
}));
vi.mock('../../app/common/renderer/components/SessionInspector/InspectorShortcuts.jsx', () => ({
  default: ({children}) => children,
}));
vi.mock('../../app/common/renderer/components/SessionInspector/Screenshot/Screenshot.jsx', () => ({
  default: () => null,
}));
vi.mock('../../app/common/renderer/components/SessionInspector/SessionInspectorTabs.jsx', () => ({
  default: () => null,
}));
vi.mock('../../app/common/renderer/components/SessionInspector/SessionExpiryModal.jsx', () => ({
  default: () => null,
}));

import Inspector from '../../app/common/renderer/components/SessionInspector/SessionInspector.jsx';

function render(inspector) {
  lifecycle.inspector = inspector;
  lifecycle.refIndex = 0;
  renderToStaticMarkup(createElement(Inspector));
  const {effect, previousEffect} = lifecycle;
  if (!previousEffect || effect.dependencies.some((value, index) => value !== previousEffect.dependencies[index])) {
    effect.callback();
  }
  lifecycle.previousEffect = effect;
}

function startupCounts() {
  return [
    actions.applyClientMethod,
    actions.storeSessionSettings,
    actions.getSavedClientFramework,
    actions.runKeepAliveLoop,
    actions.setSessionTime,
  ].map((action) => action.mock.calls.length);
}

describe('Inspector live session initialization', () => {
  beforeEach(() => {
    lifecycle.refs = [];
    lifecycle.refIndex = 0;
    lifecycle.effect = null;
    lifecycle.previousEffect = null;
    lifecycle.header = null;
  });

  it('does not initialize a snapshot and still allows closing it', async () => {
    render({isSnapshot: true, driver: null});
    expect(startupCounts()).toEqual([0, 0, 0, 0, 0]);

    await lifecycle.header.quitSessionAndReturn();

    expect(actions.quitSession).toHaveBeenCalledExactlyOnceWith({
      reason: undefined,
      manualQuit: true,
      detachOnly: false,
    });
    expect(navigate).toHaveBeenCalledExactlyOnceWith('/session', {replace: true});
    expect(startupCounts()).toEqual([0, 0, 0, 0, 0]);
  });

  it('initializes a live driver once, including when its effect is replayed', () => {
    const inspector = {isSnapshot: false, driver: {sessionId: 'initial'}};
    render(inspector);
    lifecycle.effect.callback();
    render(inspector);

    expect(startupCounts()).toEqual([1, 1, 1, 1, 1]);
    expect(actions.applyClientMethod).toHaveBeenCalledExactlyOnceWith({methodName: 'getPageSource'});
    expect(actions.setSessionTime).toHaveBeenCalledWith(expect.any(Number));
  });

  it.each([false, true])('waits for the first live driver (initial snapshot: %s)', (isSnapshot) => {
    render({isSnapshot, driver: null});
    expect(startupCounts()).toEqual([0, 0, 0, 0, 0]);

    render({isSnapshot: false, driver: {sessionId: 'initial'}});

    expect(startupCounts()).toEqual([1, 1, 1, 1, 1]);
  });

  it('does not initialize a replacement driver', () => {
    render({isSnapshot: false, driver: {sessionId: 'initial'}});
    render({isSnapshot: false, driver: {sessionId: 'replacement'}});

    expect(startupCounts()).toEqual([1, 1, 1, 1, 1]);
  });

  it('does not initialize again after the temporary null driver during restart', () => {
    render({isSnapshot: false, driver: {sessionId: 'initial'}});
    render({isSnapshot: false, driver: null});
    render({isSnapshot: false, driver: {sessionId: 'replacement'}});

    expect(startupCounts()).toEqual([1, 1, 1, 1, 1]);
  });

  it('does not reset initialization during an offline transition in the same mount', () => {
    render({isSnapshot: false, driver: {sessionId: 'initial'}});
    render({isSnapshot: true, driver: null});
    render({isSnapshot: false, driver: null});
    render({isSnapshot: false, driver: {sessionId: 'replacement'}});

    expect(startupCounts()).toEqual([1, 1, 1, 1, 1]);
  });

  it('initializes the next live session when the inspector is remounted', () => {
    render({isSnapshot: false, driver: {sessionId: 'initial'}});
    lifecycle.refs = [];
    lifecycle.previousEffect = null;
    render({isSnapshot: false, driver: {sessionId: 'next'}});

    expect(startupCounts()).toEqual([2, 2, 2, 2, 2]);
  });
});
