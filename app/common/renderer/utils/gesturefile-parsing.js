import _ from 'lodash';

import {POINTER_TYPES} from '../constants/gestures.js';
import {log} from './logger.js';

/**
 * Parses the gesture file contents in JSON and runs validation checks for the JSON contents.
 *
 * @param {string} gestureFileString Gesture file contents as a string
 * @returns {object|null} Gesture file in JSON format, or null if any validations failed
 */
export function parseGestureFileContents(gestureFileString) {
  let gestureJSON;
  try {
    gestureJSON = JSON.parse(gestureFileString);
  } catch {
    log.error(`Error parsing gesture file: file is not valid JSON`);
    return null;
  }
  return validateGestureJSON(gestureJSON);
}

/**
 * Validates the properties of a gesture file JSON object.
 *
 * @param {object} gestureJSON Gesture file contents in JSON
 * @returns {object|null} Validated JSON, or null if any validations failed
 */
export function validateGestureJSON(gestureJSON) {
  if (
    !gestureJSON ||
    !objectHasStringProperty(gestureJSON, 'name') ||
    !objectHasStringProperty(gestureJSON, 'description') ||
    !areGestureActionsValid(gestureJSON)
  ) {
    return null;
  }
  return gestureJSON;
}

/**
 * Checks if the actions field in the gesture file is valid.
 *
 * @param {object} gestureJSON Gesture file contents in JSON
 * @returns {boolean} True if the actions field is valid, otherwise false
 */
function areGestureActionsValid(gestureJSON) {
  if (!('actions' in gestureJSON && _.isArray(gestureJSON.actions))) {
    return logValidationError("'actions' property is missing or not an array");
  }
  for (const action of gestureJSON.actions) {
    if (!_.isPlainObject(action)) {
      return logValidationError(`action '${JSON.stringify(action)}' is not an object`);
    }
    for (const actionProp of ['name', 'color', 'id']) {
      if (!objectHasStringProperty(action, actionProp, `action '${JSON.stringify(action)}' `)) {
        return false;
      }
    }
    if (!/^#[0-9A-F]{6}$/i.test(action.color)) {
      return logValidationError(
        `action '${JSON.stringify(action)}' color '${action.color}' is not a valid hex color`,
      );
    }
    if (!('ticks' in action && _.isArray(action.ticks))) {
      return logValidationError(
        `action '${JSON.stringify(action)}' 'ticks' property is missing or not an array`,
      );
    }
    for (const tick of action.ticks) {
      if (!isActionTickValid(tick)) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Checks if a tick object in an action is valid.
 *
 * @param {object} tickJSON Tick object in the gesture file
 * @returns {boolean} True if the tick is valid, otherwise false
 */
function isActionTickValid(tickJSON) {
  if (!_.isPlainObject(tickJSON)) {
    return logValidationError(`tick '${JSON.stringify(tickJSON)}' is not an object`);
  }
  if (!objectHasStringProperty(tickJSON, 'id', `tick '${JSON.stringify(tickJSON)}' `)) {
    return false;
  }
  // allow empty ticks
  if (!tickJSON.type) {
    return true;
  }
  switch (tickJSON.type) {
    case POINTER_TYPES.POINTER_MOVE:
      return arePointerPropertiesValid(tickJSON, ['x', 'y', 'duration']);
    case POINTER_TYPES.POINTER_UP:
    case POINTER_TYPES.POINTER_DOWN:
      return arePointerPropertiesValid(tickJSON, ['button']);
    case POINTER_TYPES.PAUSE:
      return arePointerPropertiesValid(tickJSON, ['duration']);
    default:
      return logValidationError(`unsupported tick type '${tickJSON.type}'`);
  }
}

/**
 * Checks if the required pointer properties exist and are numbers in a tick object.
 *
 * @param {object} tickJSON Tick object in the gesture file
 * @param {string[]} propsArray Array of required property names
 * @returns {boolean} True if all properties are valid, otherwise false
 */
function arePointerPropertiesValid(tickJSON, propsArray) {
  for (const tickProp of propsArray) {
    if (!(tickProp in tickJSON && typeof tickJSON[tickProp] === 'number')) {
      return logValidationError(
        `tick '${JSON.stringify(tickJSON)}' property '${tickProp}' is missing or not a number`,
      );
    }
  }
  return true;
}

/**
 * Checks if an object has a property that is a non-empty string.
 *
 * @param {object} object The object to check
 * @param {string} propName The property name to check
 * @param {string} [prefix] Optional prefix for error messages
 * @returns {boolean} True if the property exists and is a non-empty string, otherwise false
 */
function objectHasStringProperty(object, propName, prefix = '') {
  if (!(propName in object && typeof object[propName] === 'string')) {
    return logValidationError(`${prefix}'${propName}' property is missing or not a string`);
  }
  if (object[propName].trim().length === 0) {
    return logValidationError(`${prefix}'${propName}' property is empty or only whitespace`);
  }
  return true;
}

function logValidationError(text) {
  log.error(`Error validating gesture file: ${text}`);
  return false;
}
