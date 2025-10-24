import _ from 'lodash';

import {APPIUM_TO_WD_COMMANDS} from '../constants/commands.js';

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

/**
 * Filter the map of commands supported by the current driver using multiple criteria:
 *   * Remove entries with empty values (similarly to {@link deepFilterEmpty})
 *   * Remove commands not supported by WDIO
 *   * Remove commands already filtered from the driver object (see WDSessionDriver)
 *
 * In addition to filtering, the map is modified to remove the path and HTTP method,
 * resulting in a format more similar to `ListExtensionsResponse`.
 * @param {Object} commandsResponse {@link https://github.com/appium/appium/blob/master/packages/types/lib/command-maps.ts `ListCommandsResponse`}
 * @param {*} driver instance of WDSessionDriver
 * @returns filtered object, formatted to match the {@link deepFilterEmpty} response
 */
export function filterAvailableCommands(commandsResponse, driver) {
  // commandsResponse: REST/BiDi to commands map
  // only use the REST commands for now
  if (
    _.isEmpty(commandsResponse) ||
    !('rest' in commandsResponse) ||
    _.isEmpty(commandsResponse.rest)
  ) {
    return commandsResponse;
  }
  const adjustedCommandsMap = {};
  const restCommandsMap = commandsResponse.rest;
  // restCommandsMap: base/driver/plugins source to command paths map
  for (const source in restCommandsMap) {
    const sourceCommandsMap = restCommandsMap[source];
    // sourceCommandsMap: command paths to HTTP methods map
    for (const path in sourceCommandsMap) {
      const pathsCommandsMap = sourceCommandsMap[path];
      // pathsCommandsMap: HTTP methods to commands map
      for (const method in pathsCommandsMap) {
        if (
          _.isEmpty(pathsCommandsMap[method]) ||
          !('command' in pathsCommandsMap[method]) // We need the command name, so skip commands that don't have it
        ) {
          continue;
        }
        const cmdName = pathsCommandsMap[method].command;
        if (
          !(cmdName in APPIUM_TO_WD_COMMANDS) || // skip commands not supported by WDIO
          typeof driver[APPIUM_TO_WD_COMMANDS[cmdName]] !== 'function' // skip commands omitted from WDSessionDriver
        ) {
          continue;
        }
        adjustedCommandsMap[cmdName] = deepFilterEmpty(pathsCommandsMap[method]);
      }
    }
  }
  return adjustedCommandsMap;
}
