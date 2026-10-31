import {describe, expect, it, vi} from 'vitest';

import {handleInspectorShortcut} from '../../app/common/renderer/utils/inspector-shortcuts.js';

function press(actions, options = {}) {
  const event = new Event('keydown', {cancelable: true});
  const {prevented, focusedElement, ownerDocument, ...keys} = options;
  Object.assign(event, {code: 'KeyR', altKey: true, ...keys});
  Object.defineProperties(event, {
    target: {value: focusedElement},
    currentTarget: {value: {ownerDocument}},
  });
  if (prevented) {
    event.preventDefault();
  }
  handleInspectorShortcut(event, actions);
  return event;
}

describe('Inspector keyboard shortcuts', () => {
  it('dispatches each shortcut and consumes its default action', () => {
    const refresh = vi.fn();
    const search = vi.fn();
    const record = vi.fn();
    const actions = {KeyR: refresh, KeyL: search, KeyV: record};

    for (const code of ['KeyR', 'KeyL', 'KeyV']) {
      expect(press(actions, {code}).defaultPrevented).toBe(true);
    }
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(search).toHaveBeenCalledTimes(1);
    expect(record).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['plain typing', {altKey: false}],
    ['Ctrl+Alt / AltGr', {ctrlKey: true}],
    ['Command+Alt', {metaKey: true}],
    ['Shift+Alt', {shiftKey: true}],
    ['held keys', {repeat: true}],
    ['native IME composition', {isComposing: true}],
    ['React IME composition', {nativeEvent: {isComposing: true}}],
    ['another control consumed the event', {prevented: true}],
    ['unmapped keys', {code: 'KeyX'}],
    ['inherited object properties', {code: 'constructor'}],
  ])('ignores %s', (_name, options) => {
    const action = vi.fn();
    const event = press({KeyR: action}, options);

    expect(action).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(!!options.prevented);
  });

  it('uses the physical key when Option produces a different character', () => {
    const action = vi.fn();
    press({KeyR: action}, {key: '®', code: 'KeyR'});
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('leaves events in editable controls unconsumed', () => {
    const action = vi.fn();
    const focusedElement = {closest: () => ({tagName: 'INPUT'})};
    const event = press({KeyR: action}, {focusedElement});

    expect(action).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it('does not dispatch behind a visible portal dialog or menu in its document', () => {
    const ownerDocument = {querySelectorAll: () => [{getClientRects: () => [{}]}]};
    const action = vi.fn();
    expect(press({KeyR: action}, {ownerDocument}).defaultPrevented).toBe(false);
    expect(action).not.toHaveBeenCalled();
  });

  it('ignores hidden portal contents left mounted after closing a dialog', () => {
    const ownerDocument = {querySelectorAll: () => [{getClientRects: () => []}]};
    const action = vi.fn();
    expect(press({KeyR: action}, {ownerDocument}).defaultPrevented).toBe(true);
    expect(action).toHaveBeenCalledTimes(1);
  });
});
