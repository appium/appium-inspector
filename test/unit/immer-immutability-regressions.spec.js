import {configureStore} from '@reduxjs/toolkit';
import {beforeEach, describe, expect, it, vi} from 'vitest';

const {savedSettings} = vi.hoisted(() => ({
  savedSettings: new Map(),
}));

vi.mock('#local-polyfills', () => ({
  settings: {
    has: (key) => savedSettings.has(key),
    get: (key) => savedSettings.get(key),
    set: (key, value) => savedSettings.set(key, value),
  },
  loadSessionFileIfOpened: vi.fn().mockResolvedValue(null),
  localesPath: '',
  openLink: vi.fn(),
  setTheme: vi.fn(),
  updateLanguage: vi.fn(),
}));

vi.mock('../../app/common/renderer/utils/logger.js', () => ({
  log: {debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn()},
}));

vi.mock('../../app/common/renderer/utils/notification.js', () => ({
  notification: {error: vi.fn(), info: vi.fn(), success: vi.fn(), warning: vi.fn()},
}));

vi.mock('i18next', () => ({
  default: {
    isInitialized: true,
    use: vi.fn().mockReturnThis(),
    init: vi.fn(),
    t: (key) => key,
  },
}));

import {getSavedGestures, saveGesture} from '../../app/common/renderer/actions/SessionInspector.js';
import {deletePointer} from '../../app/common/renderer/components/SessionInspector/GesturesTab/GestureEditor/GestureEditorPointerTabs.jsx';
import {POINTER_COLORS} from '../../app/common/renderer/constants/gestures.js';
import {getSetting} from '../../app/common/renderer/polyfills.js';
import createRootReducer from '../../app/common/renderer/reducers/index.js';
import {getSavedSessionsDone} from '../../app/common/renderer/reducers/SessionBuilder.js';
import {getSavedGesturesDone} from '../../app/common/renderer/reducers/SessionInspector.js';
import {
  DEFAULT_SETTINGS,
  IMPORTANT_SOURCE_ATTRIBUTES,
  SAVED_SESSIONS,
  SET_SAVED_GESTURES,
} from '../../app/common/shared/setting-defs.js';

function deepFreeze(value) {
  if (value && typeof value === 'object') {
    Object.freeze(value);
    for (const prop of Object.values(value)) {
      deepFreeze(prop);
    }
  }
  return value;
}

describe('Immer immutability regressions', function () {
  beforeEach(() => {
    savedSettings.clear();
  });

  it('deletePointer handles deeply frozen pointers from Redux loadedGesture state', function () {
    const pointers = deepFreeze([
      {id: '1', name: 'pointer1', color: POINTER_COLORS[0], ticks: [{id: '1.1', type: 'pointerDown'}]},
      {id: '2', name: 'pointer2', color: POINTER_COLORS[1], ticks: [{id: '2.1', type: 'pause', duration: 100}]},
      {
        id: '3',
        name: 'pointer3',
        color: POINTER_COLORS[2],
        ticks: [
          {id: '3.1', type: 'pointerMove', x: 10, y: 20},
          {id: '3.2', type: 'pointerUp'},
        ],
      },
    ]);
    const unselectTick = vi.fn();

    const [newPointers, newActivePointerId] = deletePointer('2', pointers, unselectTick);

    expect(unselectTick).toHaveBeenCalledTimes(1);
    expect(newActivePointerId).toBe('1');
    expect(newPointers).toEqual([
      {id: '1', name: 'pointer1', color: POINTER_COLORS[0], ticks: [{id: '1.1', type: 'pointerDown'}]},
      {
        id: '2',
        name: 'pointer3',
        color: POINTER_COLORS[1],
        ticks: [
          {id: '2.1', type: 'pointerMove', x: 10, y: 20},
          {id: '2.2', type: 'pointerUp'},
        ],
      },
    ]);
    // Original frozen state must remain intact
    expect(pointers[2].id).toBe('3');
    expect(pointers[2].ticks[0].id).toBe('3.1');
  });

  it('getSetting returns fresh clones so Redux/Immer never freezes DEFAULT_SETTINGS', async function () {
    const store = configureStore({
      reducer: createRootReducer(),
      middleware: (getDefaultMiddleware) => getDefaultMiddleware({serializableCheck: false}),
    });

    const gesturesDefault = await getSetting(SET_SAVED_GESTURES);
    const sessionsDefault = await getSetting(SAVED_SESSIONS);
    const attrsDefault = await getSetting(IMPORTANT_SOURCE_ATTRIBUTES);

    expect(gesturesDefault).not.toBe(DEFAULT_SETTINGS[SET_SAVED_GESTURES]);
    expect(sessionsDefault).not.toBe(DEFAULT_SETTINGS[SAVED_SESSIONS]);
    expect(attrsDefault).not.toBe(DEFAULT_SETTINGS[IMPORTANT_SOURCE_ATTRIBUTES]);

    store.dispatch(getSavedGesturesDone(gesturesDefault));
    store.dispatch(getSavedSessionsDone(sessionsDefault));

    expect(Object.isFrozen(DEFAULT_SETTINGS[SET_SAVED_GESTURES])).toBe(false);
    expect(Object.isFrozen(DEFAULT_SETTINGS[SAVED_SESSIONS])).toBe(false);
    expect(Object.isFrozen(DEFAULT_SETTINGS[IMPORTANT_SOURCE_ATTRIBUTES])).toBe(false);
  });

  it('saveGesture succeeds after getSavedGestures dispatches default empty settings into Redux', async function () {
    const store = configureStore({
      reducer: createRootReducer(),
      middleware: (getDefaultMiddleware) => getDefaultMiddleware({serializableCheck: false}),
    });

    // Simulate opening Saved Gestures when no gestures are persisted yet
    await getSavedGestures()(store.dispatch);
    expect(store.getState().inspector.savedGestures).toEqual([]);
    expect(Object.isFrozen(DEFAULT_SETTINGS[SET_SAVED_GESTURES])).toBe(false);

    // Save a new (frozen) gesture
    const newGesture = deepFreeze({
      name: 'Swipe Up',
      description: 'Scroll feed',
      actions: [{id: '1', name: 'pointer1', color: POINTER_COLORS[0], ticks: [{id: '1.1', type: 'pause'}]}],
    });
    await saveGesture(newGesture)(store.dispatch);

    const afterCreate = store.getState().inspector.savedGestures;
    expect(afterCreate).toHaveLength(1);
    expect(afterCreate[0].name).toBe('Swipe Up');
    expect(afterCreate[0].id).toBeTruthy();
    expect(DEFAULT_SETTINGS[SET_SAVED_GESTURES]).toEqual([]);

    // Edit the saved gesture (reading back from storage + mutating clone)
    const editedGesture = deepFreeze({
      id: afterCreate[0].id,
      name: 'Swipe Down',
      description: 'Updated',
      actions: afterCreate[0].actions,
    });
    await saveGesture(editedGesture)(store.dispatch);

    const afterEdit = store.getState().inspector.savedGestures;
    expect(afterEdit).toHaveLength(1);
    expect(afterEdit[0].name).toBe('Swipe Down');
    expect(afterEdit[0].description).toBe('Updated');
  });
});
