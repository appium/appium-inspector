import _ from 'lodash';

/**
 * Try to detect if the input value should be a boolean/number/array/object,
 * and if so, convert it to that
 *
 * @param {*} value the value of a command parameter
 * @returns the value converted to the type it matches best
 */
export function adjustParamValueType(value) {
  if (Number(value).toString() === value) {
    return Number(value);
  } else if (['true', 'false'].includes(value)) {
    return value === 'true';
  } else {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
}

/**
 * Check if a value is an empty object or array ({} or [])
 *
 * @param {*} value any value (object, array, primitive)
 * @returns whether the item is an empty object/array or not
 */
const isEmptyObject = (item) => _.isObjectLike(item) && _.isEmpty(item);

/**
 * Recursively remove key/value pairs (or array entries) whose values are empty objects or arrays.
 * If this causes the parent object/array to become empty,
 * this parent will be removed from its own parent as well.
 *
 * @param {*} value any value (object, array, primitive)
 * @returns the value with empty entries removed
 */
export function deepFilterEmpty(value) {
  if (_.isArray(value)) {
    // Recurse into each array element, then remove empty entries
    const mapped = value.map((v) => deepFilterEmpty(v));
    return mapped.filter((v) => !isEmptyObject(v));
  }

  if (_.isPlainObject(value)) {
    // Recurse into object properties, then pick only non-empty values
    const mapped = _.mapValues(value, (v) => deepFilterEmpty(v));
    return _.pickBy(mapped, (v) => !isEmptyObject(v));
  }

  // Primitives are returned as-is
  return value;
}
