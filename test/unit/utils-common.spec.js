import {describe, expect, it, vi} from 'vitest';

import {
  debounce,
  isEmpty,
  isEqual,
  isPlainObject,
  omit,
} from '../../app/common/renderer/utils/common.js';

describe('utils/common.js', function () {
  describe('#isPlainObject', function () {
    it('should return true for plain objects', function () {
      expect(isPlainObject({})).toBe(true);
      expect(isPlainObject({a: 1})).toBe(true);
      expect(isPlainObject(Object.create(null))).toBe(true);
    });

    it('should return false for non-plain objects', function () {
      expect(isPlainObject([])).toBe(false);
      expect(isPlainObject(null)).toBe(false);
      expect(isPlainObject(undefined)).toBe(false);
      expect(isPlainObject('foo')).toBe(false);
      expect(isPlainObject(1)).toBe(false);
      expect(isPlainObject(new Date())).toBe(false);
    });
  });

  describe('#isEmpty', function () {
    it('should return true for empty values', function () {
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
      expect(isEmpty('')).toBe(true);
      expect(isEmpty([])).toBe(true);
      expect(isEmpty({})).toBe(true);
    });

    it('should return false for non-empty values', function () {
      expect(isEmpty('foo')).toBe(false);
      expect(isEmpty([1])).toBe(false);
      expect(isEmpty({a: 1})).toBe(false);
    });
  });

  describe('#isEqual', function () {
    it('should return true for deeply equal values', function () {
      expect(isEqual({a: 1, b: [1, 2, {c: 3}]}, {a: 1, b: [1, 2, {c: 3}]})).toBe(true);
      expect(isEqual([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(isEqual(null, null)).toBe(true);
    });

    it('should return false for different values', function () {
      expect(isEqual({a: 1}, {a: 2})).toBe(false);
      expect(isEqual({a: 1}, {a: 1, b: 2})).toBe(false);
      expect(isEqual([1, 2], [1, 2, 3])).toBe(false);
      expect(isEqual([1, 2], {0: 1, 1: 2})).toBe(false);
    });
  });

  describe('#omit', function () {
    it('should remove a single key', function () {
      expect(omit({a: 1, b: 2}, 'a')).toEqual({b: 2});
    });

    it('should remove multiple keys', function () {
      expect(omit({a: 1, b: 2, c: 3}, ['a', 'c'])).toEqual({b: 2});
    });

    it('should not mutate the original object', function () {
      const obj = {a: 1, b: 2};
      omit(obj, 'a');
      expect(obj).toEqual({a: 1, b: 2});
    });
  });

  describe('#debounce', function () {
    it('should only invoke the function once after the wait period', function () {
      vi.useFakeTimers();
      const fn = vi.fn();
      const debounced = debounce(fn, 50);
      debounced();
      debounced();
      debounced();
      expect(fn).not.toHaveBeenCalled();
      vi.advanceTimersByTime(50);
      expect(fn).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });

    it('should not invoke the function if cancelled', function () {
      vi.useFakeTimers();
      const fn = vi.fn();
      const debounced = debounce(fn, 50);
      debounced();
      debounced.cancel();
      vi.advanceTimersByTime(50);
      expect(fn).not.toHaveBeenCalled();
      vi.useRealTimers();
    });
  });
});
