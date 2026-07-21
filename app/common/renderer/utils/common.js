/**
 * Small collection of generic helpers that used to be provided by lodash.
 * Kept minimal on purpose: only the semantics actually needed by this codebase are implemented.
 */

/**
 * Returns true if the value is a plain object (created via `{}` or `Object.create(null)`),
 * as opposed to an array, class instance, or other object type.
 *
 * @param {*} value
 * @returns {boolean}
 */
export function isPlainObject(value) {
  if (value == null || typeof value !== 'object') {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === null || prototype === Object.prototype;
}

/**
 * Returns true when the value has no elements/properties (mirrors lodash's `isEmpty`
 * for the value types actually used in this codebase: null/undefined, strings, arrays,
 * and plain objects).
 *
 * @param {*} value
 * @returns {boolean}
 */
export function isEmpty(value) {
  if (value == null) {
    return true;
  }
  if (typeof value === 'string' || Array.isArray(value)) {
    return value.length === 0;
  }
  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }
  return true;
}

/**
 * Performs a deep equality check between two values (objects, arrays, and primitives).
 *
 * @param {*} a
 * @param {*} b
 * @returns {boolean}
 */
export function isEqual(a, b) {
  if (Object.is(a, b)) {
    return true;
  }
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return false;
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
      return false;
    }
    return a.every((item, index) => isEqual(item, b[index]));
  }
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) {
    return false;
  }
  return aKeys.every((key) => Object.hasOwn(b, key) && isEqual(a[key], b[key]));
}

/**
 * Returns a shallow copy of `obj` with the given key(s) removed.
 *
 * @param {Object} obj
 * @param {string|string[]} keys a single key or array of keys to omit
 * @returns {Object}
 */
export function omit(obj, keys) {
  const keysToOmit = new Set(Array.isArray(keys) ? keys : [keys]);
  return Object.fromEntries(Object.entries(obj).filter(([key]) => !keysToOmit.has(key)));
}

/**
 * Creates a debounced version of `func` that delays invoking it until `wait` milliseconds
 * have elapsed since the last time the debounced function was called. The returned function
 * exposes a `cancel()` method to cancel any pending invocation.
 *
 * @param {Function} func
 * @param {number} wait
 * @returns {Function & {cancel: () => void}}
 */
export function debounce(func, wait = 0) {
  let timeoutId;
  let result;

  function debounced(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      timeoutId = undefined;
      result = func(...args);
    }, wait);
    return result;
  }

  debounced.cancel = () => {
    clearTimeout(timeoutId);
    timeoutId = undefined;
  };

  return debounced;
}
