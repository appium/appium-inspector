import {isPlainObject, omit} from './common.js';
import {getRandomId} from './other.js';

// Matches `${VAR_NAME}` placeholders without nested braces
const ENV_VAR_PATTERN = /\$\{([^{}]+)\}/g;

/**
 * Normalizes raw environment variable entries into a consistent array shape
 * with unique ids and explicit string/boolean fields.
 *
 * @param {Array<object>} [envVars]
 * @returns {Array<{id: string, name: string, value: string, isSecret: boolean}>}
 */
export function normalizeEnvVars(envVars = []) {
  if (!Array.isArray(envVars)) {
    return [];
  }
  return envVars
    .filter((envVar) => isPlainObject(envVar))
    .map((envVar) => ({
      id: typeof envVar.id === 'string' && envVar.id.length > 0 ? envVar.id : getRandomId(),
      name: typeof envVar.name === 'string' ? envVar.name : '',
      value: typeof envVar.value === 'string' ? envVar.value : String(envVar.value ?? ''),
      isSecret: typeof envVar.isSecret === 'boolean' ? envVar.isSecret : true,
    }));
}

/**
 * Builds a lookup map of trimmed variable names to their string values.
 * Using a Map avoids prototype property collisions (e.g. `toString`, `__proto__`).
 *
 * @param {Array<object>} [envVars]
 * @param {{includeSecrets?: boolean}} [options]
 * @returns {Map<string, string>}
 */
export function buildEnvVarMap(envVars = [], {includeSecrets = true} = {}) {
  const envMap = new Map();
  if (!Array.isArray(envVars)) {
    return envMap;
  }
  for (const envVar of envVars) {
    if (!isPlainObject(envVar) || typeof envVar.name !== 'string') {
      continue;
    }
    const trimmedName = envVar.name.trim();
    if (!trimmedName) {
      continue;
    }
    if (!includeSecrets && envVar.isSecret !== false) {
      continue;
    }
    envMap.set(trimmedName, typeof envVar.value === 'string' ? envVar.value : String(envVar.value ?? ''));
  }
  return envMap;
}

/**
 * Replaces `${VAR_NAME}` placeholders in a single string using a pre-built Map.
 * Unmatched placeholders are kept verbatim, and substituted values are not re-evaluated.
 *
 * @param {string} value
 * @param {Map<string, string>} envMap
 * @returns {string}
 */
export function interpolateEnvVarsInString(value, envMap) {
  if (typeof value !== 'string' || envMap.size === 0) {
    return value;
  }
  return value.replace(ENV_VAR_PATTERN, (match, rawName) => {
    const trimmedName = rawName.trim();
    return envMap.has(trimmedName) ? envMap.get(trimmedName) : match;
  });
}

function interpolateValue(value, envMap) {
  if (typeof value === 'string') {
    return interpolateEnvVarsInString(value, envMap);
  }
  if (Array.isArray(value)) {
    return value.map((item) => interpolateValue(item, envMap));
  }
  if (isPlainObject(value)) {
    const result = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      result[key] = interpolateValue(nestedValue, envMap);
    }
    return result;
  }
  return value;
}

/**
 * Recursively interpolates `${VAR_NAME}` placeholders across a capabilities object
 * without mutating the input object.
 *
 * @param {object} caps
 * @param {Array<object>} [envVars]
 * @param {{includeSecrets?: boolean}} [options]
 * @returns {object}
 */
export function interpolateCapabilities(caps, envVars = [], {includeSecrets = true} = {}) {
  if (!isPlainObject(caps)) {
    return caps;
  }
  const envMap = buildEnvVarMap(envVars, {includeSecrets});
  return interpolateValue(caps, envMap);
}

/**
 * Prepares environment variables for `.appiumsession` export.
 * Strips internal UI ids and clears values of secret variables so secrets are
 * never written to exported files while preserving their names as placeholders.
 *
 * @param {Array<object>} [envVars]
 * @returns {Array<{name: string, value: string, isSecret: boolean}>}
 */
export function prepareEnvVarsForExport(envVars = []) {
  if (!Array.isArray(envVars)) {
    return [];
  }
  return envVars
    .filter((envVar) => isPlainObject(envVar))
    .map((envVar) => {
      const cleaned = omit(envVar, 'id');
      const isSecret = typeof cleaned.isSecret === 'boolean' ? cleaned.isSecret : true;
      return {
        name: typeof cleaned.name === 'string' ? cleaned.name : '',
        value: isSecret ? '' : typeof cleaned.value === 'string' ? cleaned.value : String(cleaned.value ?? ''),
        isSecret,
      };
    });
}

/**
 * Returns the set of trimmed environment variable names that appear more than once.
 *
 * @param {Array<object>} [envVars]
 * @returns {Set<string>}
 */
export function findDuplicateEnvVarNames(envVars = []) {
  const seen = new Set();
  const duplicates = new Set();
  if (!Array.isArray(envVars)) {
    return duplicates;
  }
  for (const envVar of envVars) {
    if (!isPlainObject(envVar) || typeof envVar.name !== 'string') {
      continue;
    }
    const trimmedName = envVar.name.trim();
    if (!trimmedName) {
      continue;
    }
    if (seen.has(trimmedName)) {
      duplicates.add(trimmedName);
    } else {
      seen.add(trimmedName);
    }
  }
  return duplicates;
}
