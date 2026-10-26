import {configureStore} from '@reduxjs/toolkit';
import {beforeEach, describe, expect, it, vi} from 'vitest';

import {
  getCapsObject,
  loadCapabilityTemplate,
  saveRawDesiredCaps,
  saveSession,
  setCapabilityParam,
} from '../../app/common/renderer/actions/SessionBuilder.js';
import {CAPABILITY_TEMPLATES} from '../../app/common/renderer/constants/capability-templates.js';
import {SERVER_TYPES, SESSION_BUILDER_TABS} from '../../app/common/renderer/constants/session-builder.js';
import {getSetting, setSetting} from '../../app/common/renderer/polyfills.js';
import builder from '../../app/common/renderer/reducers/SessionBuilder.js';
import {SAVED_SESSIONS} from '../../app/common/shared/setting-defs.js';

vi.mock('../../app/common/renderer/utils/logger.js', () => ({
  log: {debug: vi.fn(), error: vi.fn(), info: vi.fn()},
}));
vi.mock('i18next', () => ({
  default: {isInitialized: true, use: vi.fn().mockReturnThis(), init: vi.fn(), t: (key) => key},
}));
vi.mock('../../app/common/renderer/polyfills.js', () => ({
  setSetting: vi.fn(),
  getSetting: vi.fn(),
  openLink: vi.fn(),
  setTheme: vi.fn(),
  updateLanguage: vi.fn(),
  localesPath: '',
  loadSessionFileIfOpened: vi.fn().mockResolvedValue(null),
}));

const existingSet = {
  uuid: 'existing-set',
  name: 'Keep this set',
  date: 123,
  caps: [{id: 'old-cap', name: 'platformName', value: 'Existing', enabled: true, type: 'text'}],
};

const createStore = (overrides = {}) =>
  configureStore({
    reducer: {builder},
    preloadedState: {
      builder: {
        ...builder(undefined, {type: 'init'}),
        server: {remote: {hostname: 'example.test', port: 4725, path: '/custom', ssl: true}},
        serverType: SERVER_TYPES.REMOTE,
        visibleProviders: [SERVER_TYPES.SAUCE],
        caps: existingSet.caps,
        capsUUID: existingSet.uuid,
        capsName: existingSet.name,
        savedSessions: [existingSet],
        tabKey: SESSION_BUILDER_TABS.SAVED_CAPS,
        ...overrides,
      },
    },
  });

describe('capability templates', () => {
  beforeEach(() => {
    const settings = new Map([[SAVED_SESSIONS, structuredClone([existingSet])]]);
    getSetting.mockImplementation(async (key) => structuredClone(settings.get(key)));
    setSetting.mockImplementation(async (key, value) => settings.set(key, structuredClone(value)));
  });

  it.each([
    ['android-native', {platformName: 'Android', 'appium:automationName': 'UiAutomator2'}],
    ['android-chrome', {platformName: 'Android', 'appium:automationName': 'UiAutomator2', browserName: 'Chrome'}],
    ['ios-native', {platformName: 'iOS', 'appium:automationName': 'XCUITest'}],
    ['ios-safari', {platformName: 'iOS', 'appium:automationName': 'XCUITest', browserName: 'Safari'}],
  ])('loads %s as a fresh editable set without writing settings', (id, expected) => {
    const store = createStore();
    const previous = store.getState().builder;
    store.dispatch(loadCapabilityTemplate(id));
    const current = store.getState().builder;

    expect(getCapsObject(current.caps)).toEqual(expected);
    expect(current.caps.every((cap) => cap.enabled && cap.type === 'text' && cap.id !== 'old-cap')).toBe(true);
    expect(new Set(current.caps.map(({id}) => id)).size).toBe(current.caps.length);
    expect(current).toMatchObject({
      capsUUID: null,
      capsName: null,
      isCapsDirty: true,
      tabKey: SESSION_BUILDER_TABS.CAPS_BUILDER,
    });
    expect(current.server).toBe(previous.server);
    expect(current.serverType).toBe(previous.serverType);
    expect(current.visibleProviders).toBe(previous.visibleProviders);
    expect(current.savedSessions).toBe(previous.savedSessions);
    expect(previous.savedSessions).toEqual([existingSet]);
    expect(setSetting).not.toHaveBeenCalled();
  });

  it('discards stale JSON/name editor state only when a template is loaded', () => {
    const store = createStore({
      isEditingDesiredCapsName: true,
      desiredCapsName: 'Unsaved name',
      isDuplicateCapsName: true,
      isEditingDesiredCaps: true,
      rawDesiredCaps: '{broken',
      isValidCapsJson: false,
      isValidatingCapsJson: true,
      invalidCapsJsonReason: 'Invalid JSON',
      showSaveAsModal: true,
      saveAsText: 'Old name',
    });
    store.dispatch(loadCapabilityTemplate('ios-native'));
    expect(store.getState().builder).toMatchObject({
      isEditingDesiredCapsName: false,
      desiredCapsName: null,
      isDuplicateCapsName: false,
      isEditingDesiredCaps: false,
      rawDesiredCaps: null,
      isValidCapsJson: true,
      isValidatingCapsJson: false,
      invalidCapsJsonReason: null,
      showSaveAsModal: false,
      saveAsText: null,
    });
  });

  it('ignores an unknown template without replacing current work', () => {
    const store = createStore();
    const previous = store.getState();
    store.dispatch(loadCapabilityTemplate('not-a-template'));
    expect(store.getState()).toBe(previous);
    expect(setSetting).not.toHaveBeenCalled();
  });

  it('creates independent fields every time and retains the built-in values after editing', () => {
    const store = createStore();
    store.dispatch(loadCapabilityTemplate('android-native'));
    const first = store.getState().builder.caps;
    store.dispatch(setCapabilityParam(first[0].id, 'value', 'Edited'));
    store.dispatch(loadCapabilityTemplate('android-native'));
    const second = store.getState().builder.caps;
    expect(getCapsObject(second).platformName).toBe('Android');
    expect(second.map(({id}) => id).some((id) => first.some((cap) => cap.id === id))).toBe(false);
    expect(CAPABILITY_TEMPLATES.find(({id}) => id === 'android-native').caps.platformName).toBe('Android');
  });

  it('supports raw JSON customization and saves a new set without overwriting the selected saved set', async () => {
    const store = createStore();
    store.dispatch(loadCapabilityTemplate('android-native'));
    const customized = {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:udid': 'test-device',
      'appium:noReset': true,
    };
    await store.dispatch(saveRawDesiredCaps(store.getState().builder.caps, JSON.stringify(customized)));
    let current = store.getState().builder;
    expect(getCapsObject(current.caps)).toEqual(customized);
    await store.dispatch(
      saveSession(
        {server: current.server, serverType: current.serverType, caps: current.caps, name: 'My template'},
        true,
      ),
    );
    const saved = await getSetting(SAVED_SESSIONS);
    expect(saved).toHaveLength(2);
    expect(saved[0]).toEqual(existingSet);
    expect(saved[1].name).toBe('My template');
    expect(saved[1].uuid).not.toBe(existingSet.uuid);
    expect(getCapsObject(saved[1].caps)).toEqual(customized);
    current = store.getState().builder;
    expect(current.capsUUID).toBe(saved[1].uuid);
    expect(current.capsName).toBe('My template');
    expect(current.isCapsDirty).toBeUndefined();
  });

  it.each([false, true])('does not mutate shared settings when saving a set (overwrite: %s)', async (overwrite) => {
    const store = createStore();
    const sharedSettings = store.getState().builder.savedSessions;
    const original = structuredClone(sharedSettings);
    getSetting.mockResolvedValueOnce(sharedSettings);
    const current = store.getState().builder;

    await store.dispatch(
      saveSession({
        server: current.server,
        serverType: current.serverType,
        caps: [{name: 'platformName', value: 'Changed', type: 'text', enabled: true}],
        name: 'Saved copy',
        ...(overwrite ? {uuid: existingSet.uuid} : {}),
      }),
    );

    expect(sharedSettings).toEqual(original);
    const saved = await getSetting(SAVED_SESSIONS);
    expect(saved).toHaveLength(overwrite ? 1 : 2);
    expect(saved[overwrite ? 0 : 1].name).toBe('Saved copy');
    expect(getCapsObject(saved[overwrite ? 0 : 1].caps)).toEqual({platformName: 'Changed'});
    if (!overwrite) {
      expect(saved[0]).toEqual(existingSet);
    }
  });
});
