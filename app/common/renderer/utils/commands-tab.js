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
 * Filter the method map to only include methods matching the search query,
 * if any, and then convert it to an array of [methodName, methodDetails] pairs.
 *
 * @param {*} methodMap map of methods and their details
 * @param {*} searchQuery user-provided search query
 * @returns array of [methodName, methodDetails] pairs
 */
export function transformCommandsMap(methodMap, searchQuery) {
  const filterByQuery = (methodName) => {
    if (!searchQuery) {
      return true;
    }
    return methodName.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const filteredMethodMap = _.pickBy(methodMap, (_v, k) => filterByQuery(k));
  return _.toPairs(filteredMethodMap);
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
 * Extract any parameter names (except sessionId) from a command path.
 *
 * @param {string} path command endpoint URL
 * @returns {string[]} array of parameter names
 */
export const extractParamsFromCommandPath = (path) => {
  const paramNames = [];
  const pathParts = path.split('/');
  for (const part of pathParts) {
    if (part.startsWith(':') && part !== ':sessionId') {
      paramNames.push(part.slice(1));
    }
  }
  return paramNames;
};

/**
 * Filter the map of commands supported by the current driver using multiple criteria:
 *   * Remove entries with empty values (similarly to {@link deepFilterEmpty})
 *   * Remove commands not supported by WDIO
 *
 * In addition to filtering, the map is modified to remove the path and HTTP method,
 * resulting in a format more similar to `ListExtensionsResponse`.
 *
 * @param {Object} commandsResponse {@link https://github.com/appium/appium/blob/master/packages/types/lib/command-maps.ts `ListCommandsResponse`}
 * @returns filtered object, formatted to match the {@link deepFilterEmpty} response
 */
export function filterAvailableCommands(commandsResponse) {
  const adjustedCommandsMap = {};
  // commandsResponse: REST/BiDi to commands map
  // only use the REST commands for now
  if (
    _.isEmpty(commandsResponse) ||
    !('rest' in commandsResponse) ||
    _.isEmpty(commandsResponse.rest)
  ) {
    return adjustedCommandsMap;
  }
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
        // Skip commands not supported by WDIO
        if (!(cmdName in APPIUM_TO_WD_COMMANDS)) {
          continue;
        }
        // Filter out any entries with empty values
        const commandDetails = deepFilterEmpty(pathsCommandsMap[method]);
        // For commands that include additional parameters in the path (e.g. /session/:sessionId/element/:elementId),
        // WDIO includes them in the method itself, so we need to extract their names from the path
        // and add them to the parameters array
        let commandPathParamEntries = [];
        for (const paramName of extractParamsFromCommandPath(path)) {
          commandPathParamEntries.push({name: paramName, required: true});
        }
        // Make sure to only set commandDetails.params if there are any parameters
        if (commandPathParamEntries.length > 0) {
          // Prepend the path parameters to the existing parameters array
          commandDetails.params = [...commandPathParamEntries, ...(commandDetails.params || [])];
        }
        // Add the adjusted command details to the result map, using the WDIO command name
        (adjustedCommandsMap[source] ??= {})[APPIUM_TO_WD_COMMANDS[cmdName]] = commandDetails;
      }
    }
  }
  return adjustedCommandsMap;
}
