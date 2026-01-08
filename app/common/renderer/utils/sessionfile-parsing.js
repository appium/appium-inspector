import _ from 'lodash';

import {
  CAPABILITY_TYPES,
  DEFAULT_SESSION_NAME,
  SERVER_ADVANCED_PARAMS,
  SERVER_TYPES,
  SESSION_FILE_VERSIONS,
} from '../constants/session-builder.js';
import {log} from './logger.js';

/**
 * Parses the session file contents in JSON, migrates them to the latest session file format,
 * and runs various validation checks for the JSON contents.
 *
 * @param {string} sessionFileString session file contents
 * @returns session file in JSON format, or null if any validations failed
 */
export function parseSessionFileContents(sessionFileString) {
  let sessionJSON;
  try {
    sessionJSON = JSON.parse(sessionFileString);
  } catch {
    return logParsingError('file is not valid JSON');
  }
  const updatedSessionJSON = migrateSessionJSON(sessionJSON);
  return validateSessionJSON(updatedSessionJSON);
}

/**
 * Validates the properties of a session file.
 *
 * @param {object} sessionJSON session file contents in JSON
 * @returns validated JSON, or null if any validations failed
 */
export function validateSessionJSON(sessionJSON) {
  if (
    !sessionJSON ||
    !isSessionNameValid(sessionJSON) ||
    !isSessionServerValid(sessionJSON) ||
    !areSessionCapsValid(sessionJSON)
  ) {
    return null;
  }
  return sessionJSON;
}

/**
 * Migrates a session file to the latest version, if required.
 * The file may or may not be a fully valid session file.
 *
 * @param {object} sessionJSON session file contents in JSON
 * @returns migrated JSON, or null if any validations failed
 */
export function migrateSessionJSON(sessionJSON) {
  // First validate if the version field exists
  if (!('version' in sessionJSON)) {
    return logParsingError("'version' property is missing");
  }
  // If the file is already on the latest version, no need to migrate
  if (sessionJSON.version === SESSION_FILE_VERSIONS.LATEST) {
    return sessionJSON;
  }
  let updatedSessionJSON = structuredClone(sessionJSON);
  if (sessionJSON.version === SESSION_FILE_VERSIONS.V1) {
    updatedSessionJSON = migrateSessionJsonToV2(updatedSessionJSON);
  } else {
    return logParsingError(`unsupported 'version' value '${sessionJSON.version}'`);
  }
  return updatedSessionJSON;
}

/**
 * Upgrades a session file from 1.0 to v2.
 * The file may or may not be a fully valid session file.
 *
 * @param {object} sessionJSON session file JSON with version 1.0
 * @returns migrated JSON, or null if any validations failed
 */
function migrateSessionJsonToV2(sessionJSON) {
  // Add name (placeholder)
  sessionJSON.name = DEFAULT_SESSION_NAME;
  // Bump version
  sessionJSON.version = SESSION_FILE_VERSIONS.V2;
  // Filter server to only the value that matches serverType (plus advanced),
  // creating it if it does not exist
  if (!('serverType' in sessionJSON)) {
    return logParsingError("'serverType' property is missing");
  }
  const serverTypeValue = sessionJSON.server?.[sessionJSON.serverType] ?? {};
  const advancedValue = sessionJSON.server?.[SERVER_TYPES.ADVANCED] ?? {};
  sessionJSON.server = {
    [sessionJSON.serverType]: serverTypeValue,
    [SERVER_TYPES.ADVANCED]: advancedValue,
  };
  // Remove serverType and visibleProviders if they exist
  delete sessionJSON.serverType;
  delete sessionJSON.visibleProviders;
  return sessionJSON;
}

/**
 * Checks if the caps field in the session file is valid.
 *
 * @param {object} sessionJSON session file contents in JSON
 * @returns true if the caps field is valid, otherwise false
 */
function areSessionCapsValid(sessionJSON) {
  if (!('caps' in sessionJSON && _.isArray(sessionJSON.caps))) {
    return logValidationError("'caps' property is missing or not an array");
  }
  for (const cap of sessionJSON.caps) {
    if (!_.isPlainObject(cap)) {
      return logValidationError(`capability '${JSON.stringify(cap)}' is not an object`);
    }
    for (const capProp of ['type', 'name', 'value']) {
      if (!(capProp in cap)) {
        return logValidationError(
          `capability '${JSON.stringify(cap)}' must have ` +
            `the 'type', 'name' and 'value' properties`,
        );
      }
    }
    if (!_.values(CAPABILITY_TYPES).includes(cap.type)) {
      return logValidationError(`'${cap.type}' is not a valid capability type`);
    }
  }
  return true;
}

/**
 * Checks if the name field in the session file is valid.
 *
 * @param {object} sessionJSON session file contents in JSON
 * @returns true if the name field is valid, otherwise false
 */
function isSessionNameValid(sessionJSON) {
  if (!('name' in sessionJSON && typeof sessionJSON.name === 'string')) {
    return logValidationError("'name' property is missing or not a string");
  }
  if (sessionJSON.name.trim().length === 0) {
    return logValidationError("'name' property is empty or only whitespace");
  }
  return true;
}

/**
 * Checks if the server field in the session file is valid.
 *
 * @param {object} sessionJSON session file contents in JSON
 * @returns true if the server field is valid, otherwise false
 */
function isSessionServerValid(sessionJSON) {
  if (!('server' in sessionJSON && _.isPlainObject(sessionJSON.server))) {
    return logValidationError("'server' property is missing or not an object");
  }
  const serverKeys = Object.keys(sessionJSON.server);
  if (
    serverKeys.length !== 2 ||
    !serverKeys.includes(SERVER_TYPES.ADVANCED) ||
    !_.isPlainObject(sessionJSON.server.advanced)
  ) {
    return logValidationError(
      "'server' property must have exactly two properties, " +
        "and one of them must be 'advanced', whose value must be an object",
    );
  }

  for (const key of serverKeys) {
    if (!Object.values(SERVER_TYPES).includes(key)) {
      return logValidationError(`unsupported server type '${key}'`);
    }
    if (key !== SERVER_TYPES.ADVANCED) {
      if (!_.isPlainObject(sessionJSON.server[key])) {
        return logValidationError(`'${key}' server property must be an object`);
      }
      continue;
    }
    for (const [advKey, advValue] of Object.entries(sessionJSON.server.advanced)) {
      if (!Object.values(SERVER_ADVANCED_PARAMS).includes(advKey)) {
        return logValidationError(`unsupported advanced server property '${advKey}'`);
      }
      if (
        [SERVER_ADVANCED_PARAMS.ALLOW_UNAUTHORIZED, SERVER_ADVANCED_PARAMS.USE_PROXY].includes(
          advKey,
        ) &&
        typeof advValue !== 'boolean'
      ) {
        return logValidationError(`'${advKey}' property is not a boolean`);
      }
      if (advKey === SERVER_ADVANCED_PARAMS.PROXY && typeof advValue !== 'string') {
        return logValidationError(`'${SERVER_ADVANCED_PARAMS.PROXY}' property is not a string`);
      }
    }
  }
  return true;
}

function logParsingError(text) {
  log.error(`Error parsing session file: ${text}`);
  return null;
}

function logValidationError(text) {
  log.error(`Error validating session file: ${text}`);
  return false;
}
