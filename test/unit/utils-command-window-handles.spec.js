import {setImmediate} from 'node:timers/promises';

import {describe, expect, it, vi} from 'vitest';

import {isWindowHandleParameter, loadWindowHandleOptions} from '../../app/common/renderer/utils/commands-tab.js';

const switchWindowCommand = {
  name: 'switchToWindow',
  details: {params: [{name: 'handle', required: true}]},
};

const idleState = {options: [], loading: false, error: false};
const loadingState = {options: [], loading: true, error: false};
const errorState = {options: [], loading: false, error: true};

const deferred = () => {
  let resolve, reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return {promise, resolve, reject};
};

describe('window handle command parameters', function () {
  describe('#isWindowHandleParameter', function () {
    it('should recognize a static switchToWindow handle parameter', function () {
      expect(isWindowHandleParameter(switchWindowCommand, {name: 'handle'})).toBe(true);
    });

    it('should recognize a dynamic REST switchToWindow handle parameter', function () {
      expect(isWindowHandleParameter({...switchWindowCommand, isExecute: false}, {name: 'handle'})).toBe(true);
    });

    it('should not match another parameter of switchToWindow', function () {
      expect(isWindowHandleParameter(switchWindowCommand, {name: 'name'})).toBe(false);
    });

    it('should not match a handle parameter on another command', function () {
      expect(isWindowHandleParameter({name: 'closeWindow'}, {name: 'handle'})).toBe(false);
    });

    it('should not match an execute method with the same name', function () {
      expect(isWindowHandleParameter({...switchWindowCommand, isExecute: true}, {name: 'handle'})).toBe(false);
    });

    it('should not match a missing parameter', function () {
      expect(isWindowHandleParameter(switchWindowCommand, undefined)).toBe(false);
      expect(isWindowHandleParameter(switchWindowCommand, null)).toBe(false);
    });
  });

  describe('#loadWindowHandleOptions', function () {
    it('should clear old options and report loading before a lookup resolves', async function () {
      const request = deferred();
      const getWindowHandles = vi.fn(() => request.promise);
      const onChange = vi.fn();

      const cancel = loadWindowHandleOptions(switchWindowCommand, getWindowHandles, onChange);

      expect(typeof cancel).toBe('function');
      expect(onChange.mock.calls).toEqual([[idleState], [loadingState]]);
      await setImmediate();
      expect(getWindowHandles).toHaveBeenCalledTimes(1);

      request.resolve(['window-1']);
      await setImmediate();
      expect(onChange).toHaveBeenLastCalledWith({
        options: [{value: 'window-1'}],
        loading: false,
        error: false,
      });
    });

    it('should preserve handle strings and remove duplicates in response order', async function () {
      const handles = ['window-2', '123', 'true', 'null', 'window-2', '123', 'window-1'];
      const getWindowHandles = vi.fn().mockResolvedValue(handles);
      const onChange = vi.fn();

      loadWindowHandleOptions(switchWindowCommand, getWindowHandles, onChange);
      await setImmediate();

      expect(onChange).toHaveBeenLastCalledWith({
        options: ['window-2', '123', 'true', 'null', 'window-1'].map((value) => ({value})),
        loading: false,
        error: false,
      });
      expect(handles).toEqual(['window-2', '123', 'true', 'null', 'window-2', '123', 'window-1']);
    });

    it('should finish an empty result without an error', async function () {
      const onChange = vi.fn();

      loadWindowHandleOptions(switchWindowCommand, vi.fn().mockResolvedValue([]), onChange);
      await setImmediate();

      expect(onChange.mock.calls).toEqual([[idleState], [loadingState], [idleState]]);
    });

    it('should clear loading and options when the lookup rejects', async function () {
      const onChange = vi.fn();
      const getWindowHandles = vi.fn().mockRejectedValue(new Error('unsupported command'));

      loadWindowHandleOptions(switchWindowCommand, getWindowHandles, onChange);
      await setImmediate();

      expect(onChange.mock.calls).toEqual([[idleState], [loadingState], [errorState]]);
    });

    it('should handle a lookup that throws before returning a promise', async function () {
      const onChange = vi.fn();
      const getWindowHandles = vi.fn(() => {
        throw new Error('session unavailable');
      });

      expect(() => loadWindowHandleOptions(switchWindowCommand, getWindowHandles, onChange)).not.toThrow();
      await setImmediate();

      expect(onChange).toHaveBeenLastCalledWith(errorState);
    });

    const malformedResults = [
      ['undefined', undefined],
      ['null', null],
      ['a single string', 'window-1'],
      ['a response wrapper', {value: ['window-1']}],
      ['a numeric handle', ['window-1', 123]],
      ['a null handle', ['window-1', null]],
      ['a handle object', [{value: 'window-1'}]],
    ];
    malformedResults.forEach(([label, result]) => {
      it(`should report an invalid result for ${label}`, async function () {
        const onChange = vi.fn();

        loadWindowHandleOptions(switchWindowCommand, vi.fn().mockResolvedValue(result), onChange);
        await setImmediate();

        expect(onChange.mock.calls).toEqual([[idleState], [loadingState], [errorState]]);
      });
    });

    it('should ignore a successful response after cancellation', async function () {
      const request = deferred();
      const onChange = vi.fn();
      const cancel = loadWindowHandleOptions(switchWindowCommand, () => request.promise, onChange);
      await setImmediate();

      cancel();
      cancel();
      request.resolve(['late-window']);
      await setImmediate();

      expect(onChange.mock.calls).toEqual([[idleState], [loadingState]]);
    });

    it('should ignore a rejected response after cancellation', async function () {
      const request = deferred();
      const onChange = vi.fn();
      const cancel = loadWindowHandleOptions(switchWindowCommand, () => request.promise, onChange);
      await setImmediate();

      cancel();
      request.reject(new Error('late failure'));
      await setImmediate();

      expect(onChange.mock.calls).toEqual([[idleState], [loadingState]]);
    });

    it('should preserve the reopened request result when the cancelled request finishes last', async function () {
      const oldRequest = deferred();
      const newRequest = deferred();
      const getWindowHandles = vi.fn().mockReturnValueOnce(oldRequest.promise).mockReturnValueOnce(newRequest.promise);
      const onChange = vi.fn();

      const cancelOld = loadWindowHandleOptions(switchWindowCommand, getWindowHandles, onChange);
      await setImmediate();
      cancelOld();
      loadWindowHandleOptions(switchWindowCommand, getWindowHandles, onChange);
      await setImmediate();

      newRequest.resolve(['new-window']);
      await setImmediate();
      const updatesAfterNewResult = onChange.mock.calls.length;

      oldRequest.resolve(['old-window']);
      await setImmediate();

      expect(getWindowHandles).toHaveBeenCalledTimes(2);
      expect(onChange).toHaveBeenCalledTimes(updatesAfterNewResult);
      expect(onChange).toHaveBeenLastCalledWith({
        options: [{value: 'new-window'}],
        loading: false,
        error: false,
      });
    });

    const unrelatedCommands = [
      ['an ordinary command', {name: 'getWindowHandles', details: {}}],
      ['a different handle command', {name: 'closeWindow', details: {params: [{name: 'handle'}]}}],
      ['an execute method with the same name', {...switchWindowCommand, isExecute: true}],
    ];
    unrelatedCommands.forEach(([label, command]) => {
      it(`should reset options without looking up handles for ${label}`, async function () {
        const getWindowHandles = vi.fn().mockResolvedValue(['unexpected-window']);
        const onChange = vi.fn();

        const cancel = loadWindowHandleOptions(command, getWindowHandles, onChange);
        expect(typeof cancel).toBe('function');
        await setImmediate();
        cancel();

        expect(getWindowHandles).not.toHaveBeenCalled();
        expect(onChange.mock.calls).toEqual([[idleState]]);
      });
    });
  });
});
