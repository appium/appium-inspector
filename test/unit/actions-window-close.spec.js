import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('antd', () => ({notification: {error: vi.fn(), destroy: vi.fn()}}));
vi.mock('web2driver', () => ({Web2Driver: {}}));
vi.mock('../../app/common/renderer/i18next', () => ({default: {t: (s) => s}}));
vi.mock('../../app/common/renderer/polyfills', () => ({
  getSetting: vi.fn(),
  setSetting: vi.fn(),
  ipcRenderer: {on: vi.fn(), send: vi.fn()},
  openLink: vi.fn(),
}));

const {bindWindowClose} = await import('../../app/common/renderer/actions/Session');
const {QUIT_SESSION_DONE} = await import('../../app/common/renderer/actions/Inspector');
const {default: InspectorDriver} = await import(
  '../../app/common/renderer/lib/appium/inspector-driver'
);

/**
 * Registers the inspector's window-close handler against a fake window,
 * fires 'beforeunload', and returns what happened
 */
async function fireBeforeUnload(driver) {
  let handler;
  globalThis.window = {
    addEventListener: (evt, fn) => evt === 'beforeunload' && (handler = fn),
    dispatchEvent: vi.fn(),
  };
  const dispatched = [];
  const dispatch = (action) => dispatched.push(action);
  const getState = () => ({inspector: {driver, keepAliveInterval: null, userWaitTimeout: null}});
  bindWindowClose()(dispatch, getState);
  await handler({returnValue: ''});
  return dispatched;
}

describe('actions/Session.js #bindWindowClose', function () {
  let driver;
  beforeEach(function () {
    driver = {quit: vi.fn().mockResolvedValue(undefined)};
  });
  afterEach(function () {
    InspectorDriver.clearInstance();
    delete globalThis.window;
  });

  it('should NOT end a session the inspector attached to when the page is closed/reloaded', async function () {
    driver._isAttachedSession = true;
    const dispatched = await fireBeforeUnload(driver);
    expect(driver.quit).not.toHaveBeenCalled();
    expect(dispatched.map((a) => a.type)).toContain(QUIT_SESSION_DONE);
  });

  it('should still end a session the inspector itself created when the page is closed', async function () {
    const dispatched = await fireBeforeUnload(driver);
    expect(driver.quit).toHaveBeenCalledTimes(1);
    expect(dispatched.map((a) => a.type)).toContain(QUIT_SESSION_DONE);
  });

  it('should do nothing if there is no active session', async function () {
    const dispatched = await fireBeforeUnload(null);
    expect(dispatched).toEqual([]);
  });
});
