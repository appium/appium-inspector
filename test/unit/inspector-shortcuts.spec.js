import {describe, expect, it, vi} from 'vitest';

import {registerInspectorShortcuts} from '../../app/common/renderer/utils/inspector-shortcuts.js';

function press(target, options = {}) {
  const event = new Event('keydown', {cancelable: true});
  const {prevented, focusedElement, ...keys} = options;
  Object.assign(event, {code: 'KeyR', altKey: true, ...keys});
  if (focusedElement) {
    Object.defineProperty(event, 'target', {value: focusedElement});
  }
  if (prevented) {
    event.preventDefault();
  }
  target.dispatchEvent(event);
  return event;
}

describe('Inspector keyboard shortcuts', () => {
  it('dispatches each registered shortcut and consumes its default action', () => {
    const target = new EventTarget();
    const refresh = vi.fn();
    const search = vi.fn();
    const record = vi.fn();
    const unregister = registerInspectorShortcuts(target, {KeyR: refresh, KeyL: search, KeyV: record});

    for (const code of ['KeyR', 'KeyL', 'KeyV']) {
      expect(press(target, {code}).defaultPrevented).toBe(true);
    }
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(search).toHaveBeenCalledTimes(1);
    expect(record).toHaveBeenCalledTimes(1);
    unregister();
  });

  it.each([
    ['plain typing', {altKey: false}],
    ['Ctrl+Alt / AltGr', {ctrlKey: true}],
    ['Command+Alt', {metaKey: true}],
    ['Shift+Alt', {shiftKey: true}],
    ['held keys', {repeat: true}],
    ['IME composition', {isComposing: true}],
    ['another control consumed the event', {prevented: true}],
    ['unmapped keys', {code: 'KeyX'}],
    ['inherited object properties', {code: 'constructor'}],
  ])('ignores %s', (_name, options) => {
    const target = new EventTarget();
    const action = vi.fn();
    const unregister = registerInspectorShortcuts(target, {KeyR: action});
    const event = press(target, options);

    expect(action).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(!!options.prevented);
    unregister();
  });

  it('uses the physical key when Option produces a different character', () => {
    const target = new EventTarget();
    const action = vi.fn();
    const unregister = registerInspectorShortcuts(target, {KeyR: action});
    press(target, {key: '®', code: 'KeyR'});
    expect(action).toHaveBeenCalledTimes(1);
    unregister();
  });

  it('leaves events in editable controls unconsumed', () => {
    const target = new EventTarget();
    const action = vi.fn();
    const unregister = registerInspectorShortcuts(target, {KeyR: action});
    const focusedElement = {closest: () => ({tagName: 'INPUT'})};
    const event = press(target, {focusedElement});

    expect(action).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
    unregister();
  });

  it('does not dispatch behind a visible portal dialog or menu', () => {
    const target = new EventTarget();
    target.querySelectorAll = () => [{getClientRects: () => [{}]}];
    const action = vi.fn();
    const unregister = registerInspectorShortcuts(target, {KeyR: action});
    expect(press(target).defaultPrevented).toBe(false);
    expect(action).not.toHaveBeenCalled();
    unregister();
  });

  it('ignores hidden portal contents left mounted after closing a dialog', () => {
    const target = new EventTarget();
    target.querySelectorAll = () => [{getClientRects: () => []}];
    const action = vi.fn();
    const unregister = registerInspectorShortcuts(target, {KeyR: action});
    expect(press(target).defaultPrevented).toBe(true);
    expect(action).toHaveBeenCalledTimes(1);
    unregister();
  });

  it('removes the handler and permits remounting without duplicate commands', () => {
    const target = new EventTarget();
    const action = vi.fn();
    const unregister = registerInspectorShortcuts(target, {KeyR: action});
    unregister();
    expect(press(target).defaultPrevented).toBe(false);
    expect(action).not.toHaveBeenCalled();

    const unregisterAgain = registerInspectorShortcuts(target, {KeyR: action});
    press(target);
    expect(action).toHaveBeenCalledTimes(1);
    unregisterAgain();
  });
});
