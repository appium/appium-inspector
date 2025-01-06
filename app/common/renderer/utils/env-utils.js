/**
 * Recursively interpolate environment variables in an object
 * @param {*} obj - The object to interpolate
 * @param {Map} envVars - Map of environment variables
 * @returns {*} - The interpolated object
 */
export function interpolateEnvironmentVariables(obj, envVars) {
  // Handle primitive types
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }

  // Handle strings
  if (typeof obj === 'string') {
    let result = obj;
    for (const [key, value] of envVars) {
      result = result.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
    }
    return result;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => interpolateEnvironmentVariables(item, envVars));
  }

  // Handle objects
  if (typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = interpolateEnvironmentVariables(value, envVars);
    }
    return result;
  }

  return obj;
}
