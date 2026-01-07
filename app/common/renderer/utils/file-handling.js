import _ from 'lodash';

import {
  CAPABILITY_TYPES,
  DEFAULT_SESSION_NAME,
  SERVER_ADVANCED_PARAMS,
  SERVER_TYPES,
  SESSION_FILE_VERSIONS,
} from '../constants/session-builder.js';

export function downloadFile(href, filename) {
  let element = document.createElement('a');
  element.setAttribute('href', href);
  element.setAttribute('download', filename);
  element.style.display = 'none';

  document.body.appendChild(element);
  element.click();

  document.body.removeChild(element);
}

export async function readTextFromUploadedFiles(fileList) {
  const fileReaderPromise = fileList.map((file) => {
    const reader = new FileReader();
    return new Promise((resolve) => {
      reader.onload = (event) =>
        resolve({
          fileName: file.name,
          content: event.target.result,
        });
      reader.onerror = (error) => {
        resolve({
          name: file.name,
          error: error.message,
        });
      };
      reader.readAsText(file);
    });
  });
  return await Promise.all(fileReaderPromise);
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
    return null;
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
 * Migrates a session file to the latest version, if required.
 * The file may or may not be a fully valid session file.
 *
 * @param {object} sessionJSON session file contents in JSON
 * @returns migrated JSON, or null if any validations failed
 */
export function migrateSessionJSON(sessionJSON) {
  // First validate if the version field exists
  if (!('version' in sessionJSON)) {
    return null;
  }
  // If the file is already on the latest version, no need to migrate
  if (sessionJSON.version === SESSION_FILE_VERSIONS.LATEST) {
    return sessionJSON;
  }
  let updatedSessionJSON = structuredClone(sessionJSON);
  if (sessionJSON.version === SESSION_FILE_VERSIONS.V1) {
    updatedSessionJSON = migrateSessionJsonToV2(updatedSessionJSON);
  } else {
    return null; // unsupported value for the version field
  }
  return updatedSessionJSON;
}

/**
 * Checks if the name field in the session file is valid.
 *
 * @param {object} sessionJSON session file contents in JSON
 * @returns true if the name field is valid, otherwise false
 */
function isSessionNameValid(sessionJSON) {
  return 'name' in sessionJSON && typeof sessionJSON.name === 'string';
}

/**
 * Checks if the server field in the session file is valid.
 *
 * @param {object} sessionJSON session file contents in JSON
 * @returns true if the server field is valid, otherwise false
 */
function isSessionServerValid(sessionJSON) {
  if (!('server' in sessionJSON && _.isObject(sessionJSON.server))) {
    return false;
  }
  const serverKeys = Object.keys(sessionJSON.server);
  if (
    serverKeys.length !== 2 ||
    !serverKeys.includes(SERVER_TYPES.ADVANCED) ||
    !_.isObject(sessionJSON.server.advanced)
  ) {
    return false;
  }

  for (const key of serverKeys) {
    if (!Object.values(SERVER_TYPES).includes(key)) {
      return false;
    }
    if (key !== SERVER_TYPES.ADVANCED) {
      continue;
    }
    for (const [advKey, advValue] of Object.entries(sessionJSON.server.advanced)) {
      if (!Object.values(SERVER_ADVANCED_PARAMS).includes(advKey)) {
        return false;
      }
      if (
        [SERVER_ADVANCED_PARAMS.ALLOW_UNAUTHORIZED, SERVER_ADVANCED_PARAMS.USE_PROXY].includes(
          advKey,
        ) &&
        typeof advValue !== 'boolean'
      ) {
        return false;
      }
      if (advKey === SERVER_ADVANCED_PARAMS.PROXY && typeof advValue !== 'string') {
        return false;
      }
    }
  }
  return true;
}

/**
 * Checks if the caps field in the session file is valid.
 *
 * @param {object} sessionJSON session file contents in JSON
 * @returns true if the caps field is valid, otherwise false
 */
function areSessionCapsValid(sessionJSON) {
  if (!('caps' in sessionJSON && _.isArray(sessionJSON.caps))) {
    return false;
  }
  for (const cap of sessionJSON.caps) {
    if (!_.isObject(cap)) {
      return false;
    }
    for (const capProp of ['type', 'name', 'value']) {
      if (!(capProp in cap)) {
        return false;
      }
    }
    if (!_.values(CAPABILITY_TYPES).includes(cap.type)) {
      return false;
    }
  }
  return true;
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
 * Parses the session file contents in JSON, migrates them to the latest session file format,
 * and runs various validation checks for the JSON contents.
 *
 * @param {string} sessionFileString session file contents
 * @returns session file in JSON format, or null if any validations failed
 */
export function parseSessionFileContents(sessionFileString) {
  try {
    const sessionJSON = JSON.parse(sessionFileString);
    const updatedSessionJSON = migrateSessionJSON(sessionJSON);
    return validateSessionJSON(updatedSessionJSON);
  } catch {
    return null;
  }
}
