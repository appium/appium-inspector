import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {newSession} from '../../app/common/renderer/actions/SessionBuilder.js';
import {callClientMethod, quitSession} from '../../app/common/renderer/actions/SessionInspector.js';
import AppSettings from '../../app/common/renderer/components/SessionBuilder/AppSettings/AppSettings.jsx';
import {REFRESH_DELAY_MILLIS} from '../../app/common/renderer/constants/session-inspector.js';
import InspectorDriver from '../../app/common/renderer/lib/appium/inspector-driver.js';
import WDSessionStarter from '../../app/common/renderer/lib/appium/session-starter.js';
import builderReducer from '../../app/common/renderer/reducers/SessionBuilder.js';
import inspectorReducer from '../../app/common/renderer/reducers/SessionInspector.js';
import {notification} from '../../app/common/renderer/utils/notification.js';
import {PREFER_SOURCE_FIRST} from '../../app/common/shared/setting-defs.js';

const {savedSettings, controls, settings} = vi.hoisted(() => {
  const savedSettings = new Map();
  return {
    savedSettings,
    controls: {},
    settings: {
      has: vi.fn((key) => savedSettings.has(key)),
      get: vi.fn((key) => savedSettings.get(key)),
      set: vi.fn((key, value) => savedSettings.set(key, value)),
    },
  };
});

vi.mock('#local-polyfills', () => ({settings}));
vi.mock('antd', () => {
  const passthrough = ({children}) => children;
  return {
    Button: ({onClick}) => {
      controls.open = onClick;
      return null;
    },
    Checkbox: ({onChange}) => {
      controls.change = onChange;
      return null;
    },
    Form: Object.assign(passthrough, {Item: passthrough}),
    Modal: passthrough,
    Tooltip: passthrough,
  };
});
vi.mock('react-i18next', () => ({useTranslation: () => ({t: (key) => key})}));
vi.mock('../../app/common/renderer/i18next.js', () => ({default: {t: (key) => key}}));
vi.mock('../../app/common/renderer/components/SessionBuilder/AppSettings/ChangeLanguage.jsx', () => ({
  default: () => null,
}));
vi.mock('../../app/common/renderer/components/SessionBuilder/AppSettings/ToggleTheme.jsx', () => ({
  default: () => null,
}));
vi.mock('../../app/common/renderer/lib/appium/session-starter.js', () => ({
  default: {newSession: vi.fn()},
}));
vi.mock('../../app/common/renderer/utils/notification.js', () => ({
  notification: {error: vi.fn()},
}));

const CAPS = [{type: 'text', name: 'platformName', value: 'iOS', enabled: true}];

describe('Refresh order settings', () => {
  let state;
  const dispatch = (action) => {
    state = {
      builder: builderReducer(state?.builder, action),
      inspector: inspectorReducer(state?.inspector, action),
    };
  };
  const getState = () => state;

  function createDriver() {
    const capabilities = {platformName: 'iOS'};
    return {
      client: {capabilities},
      capabilities,
      getPageSource: vi.fn().mockResolvedValue('<hierarchy/>'),
      takeScreenshot: vi.fn().mockResolvedValue('screenshot'),
      getWindowRect: vi.fn().mockResolvedValue({x: 0, y: 0, width: 320, height: 640}),
    };
  }

  beforeEach(() => {
    savedSettings.clear();
    state = undefined;
    dispatch({type: '@@INIT'});
    InspectorDriver.clearInstance();
    vi.useFakeTimers();
    renderToStaticMarkup(createElement(AppSettings));
  });

  afterEach(() => {
    InspectorDriver.clearInstance();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  async function refresh() {
    const command = callClientMethod({methodName: 'getPageSource'})(dispatch, getState);
    await vi.advanceTimersByTimeAsync(REFRESH_DELAY_MILLIS);
    return await command;
  }

  it('persists checkbox changes and applies them when starting the next session', async () => {
    const initialDriver = createDriver();
    const nextDriver = createDriver();
    WDSessionStarter.newSession.mockResolvedValueOnce(initialDriver).mockResolvedValueOnce(nextDriver);
    const instance = vi.spyOn(InspectorDriver, 'instance');

    expect(await newSession(CAPS)(dispatch, getState)).toBe(true);
    expect(getState().inspector.preferSourceFirst).toBe(false);
    expect(instance).not.toHaveBeenCalled();

    await controls.open();
    await controls.change({target: {checked: true}});
    expect(savedSettings.get(PREFER_SOURCE_FIRST)).toBe(true);
    expect(getState().inspector.preferSourceFirst).toBe(false);

    await refresh();
    expect(initialDriver.takeScreenshot).toHaveBeenCalledBefore(initialDriver.getPageSource);
    await quitSession({detachOnly: true})(dispatch, getState);

    expect(await newSession(CAPS)(dispatch, getState)).toBe(true);
    expect(getState().inspector.preferSourceFirst).toBe(true);
    await refresh();
    expect(nextDriver.getPageSource).toHaveBeenCalledBefore(nextDriver.takeScreenshot);
  });

  it('reports a failed write without persisting the checkbox change', async () => {
    savedSettings.set(PREFER_SOURCE_FIRST, false);
    settings.set.mockRejectedValueOnce(new Error('Settings write failed'));
    await controls.open();
    await expect(controls.change({target: {checked: true}})).resolves.toBeUndefined();
    expect(savedSettings.get(PREFER_SOURCE_FIRST)).toBe(false);
    expect(notification.error).toHaveBeenCalledWith({title: 'Error', description: 'Settings write failed'});
  });

  it('reports a failed preference read before starting a session', async () => {
    settings.has.mockRejectedValueOnce(new Error('Settings read failed'));
    expect(await newSession(CAPS)(dispatch, getState)).toBe(false);
    expect(WDSessionStarter.newSession).not.toHaveBeenCalled();
    expect(notification.error).toHaveBeenCalledWith(
      expect.objectContaining({title: 'Error', description: 'Settings read failed'}),
    );
  });
});
