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
 * Given an object, iterate through its properties and remove those with empty values
 *
 * @param {*} itemMap any object
 * @returns object with empty values filtered
 */
const filterEmpty = (itemMap) => _.pickBy(itemMap, (v) => !_.isEmpty(v));

/**
 * Cleanup the list of execute methods retrieved from the driver,
 * by removing parameters with empty values
 *
 * @param {*} executeMethods object containing the supported execute methods
 *     (see {@link https://github.com/appium/appium/blob/master/packages/types/lib/command-maps.ts `ListExtensionsResponse`})
 * @returns object with all empty value pairs removed
 */
export function cleanupDriverExecuteMethods(executeMethods) {
  // executeMethods: REST/BiDi protocol mapping
  const cleanedMethodMap = filterEmpty(executeMethods);
  if (!_.isEmpty(cleanedMethodMap)) {
    for (const protocol in cleanedMethodMap) {
      // cleanedMethodMap[protocol]: driver/plugin scope mapping
      cleanedMethodMap[protocol] = filterEmpty(cleanedMethodMap[protocol]);
      if (_.isEmpty(cleanedMethodMap[protocol])) {
        continue;
      }
      for (const methodName in cleanedMethodMap[protocol]) {
        // cleanedMethodMap[protocol][methodName]: execute method name to property map
        cleanedMethodMap[protocol][methodName] = filterEmpty(
          cleanedMethodMap[protocol][methodName],
        );
      }
    }
  }
  return cleanedMethodMap;
}
