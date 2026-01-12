import _ from 'lodash';

import {POINTER_TYPES} from '../constants/gestures.js';
import {log} from './logger.js';

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
