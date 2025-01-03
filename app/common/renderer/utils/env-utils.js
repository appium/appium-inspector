/**
 * Recursively interpolate environment variables in an object
 * @param {*} obj - The object to interpolate
 * @param {Array} envVars - Array of environment variables [{key: string, value: string}]
 * @returns {*} - The interpolated object
 */
export function interpolateEnvironmentVariables(obj, envVars) {
  if (typeof obj === 'string') {
    return obj.replace(/\${([^}]+)}/g, (match, key) => {
      const envVar = envVars.find((v) => v.key === key);
      return envVar ? envVar.value : match;
    });
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => interpolateEnvironmentVariables(item, envVars));
  }

  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      acc[key] = interpolateEnvironmentVariables(obj[key], envVars);
      return acc;
    }, {});
  }

  return obj;
}
