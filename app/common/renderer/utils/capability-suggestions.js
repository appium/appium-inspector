import {AUTOMATION_DRIVERS, CAPABILITY_SUGGESTIONS, PLATFORM_DRIVERS} from '../constants/capability-suggestions.js';

const isString = (value) => typeof value === 'string';

const VENDOR_PREFIX = 'appium:';

const stripVendorPrefix = (name) =>
  name.toLowerCase().startsWith(VENDOR_PREFIX) ? name.slice(VENDOR_PREFIX.length) : name;

const findCapValue = (caps, capName) => {
  const cap = caps.find(
    ({name, enabled}) =>
      enabled !== false && isString(name) && stripVendorPrefix(name.trim()).toLowerCase() === capName,
  );
  return isString(cap?.value) ? cap.value.trim().toLowerCase() : '';
};

/**
 * Determine which drivers match the platformName/automationName capabilities already entered.
 * automationName takes priority, since it identifies a single driver.
 *
 * @param {Array<{name: string, value: unknown, enabled?: boolean}>} caps
 * @returns {string[]} driver keys; empty if nothing is known
 */
export function getTargetDrivers(caps = []) {
  const automationName = findCapValue(caps, 'automationname');
  if (AUTOMATION_DRIVERS[automationName]) {
    return AUTOMATION_DRIVERS[automationName];
  }
  return PLATFORM_DRIVERS[findCapValue(caps, 'platformname')] ?? [];
}

/**
 * Get capability name suggestions for the text typed in a capability name field.
 * Suggestions contain the typed text anywhere in the name (case-insensitive, with or without the
 * `appium:` prefix). Capabilities of other drivers are hidden when the target driver is known;
 * driver-specific capabilities are listed first, then names starting with the typed text.
 *
 * @param {string} query text typed in the name field
 * @param {Array<{id?: unknown, name: string, value: unknown, enabled?: boolean}>} caps all capabilities
 * @param {unknown} [currentCapId] id of the capability being edited, so its own name is not excluded
 * @returns {Array<{name: string, type: string, drivers: string[]}>}
 */
export function getCapabilitySuggestions(query, caps = [], currentCapId) {
  const search = stripVendorPrefix((query ?? '').trim()).toLowerCase();
  if (!search) {
    return [];
  }
  const usedNames = new Set(
    caps
      .filter(({id, name}) => id !== currentCapId && isString(name))
      .map(({name}) => stripVendorPrefix(name.trim()).toLowerCase()),
  );
  const targetDrivers = getTargetDrivers(caps);
  const isForTarget = ({drivers}) => drivers.some((driver) => targetDrivers.includes(driver));

  const matches = CAPABILITY_SUGGESTIONS.filter((suggestion) => {
    const shortName = stripVendorPrefix(suggestion.name).toLowerCase();
    return (
      shortName.includes(search) &&
      !usedNames.has(shortName) &&
      (suggestion.drivers.length === 0 || targetDrivers.length === 0 || isForTarget(suggestion))
    );
  });
  // The query is matched exactly; nothing more to suggest
  if (matches.length === 1 && stripVendorPrefix(matches[0].name).toLowerCase() === search) {
    return [];
  }
  const rank = (suggestion) => [
    isForTarget(suggestion) ? 0 : 1,
    stripVendorPrefix(suggestion.name).toLowerCase().startsWith(search) ? 0 : 1,
  ];
  return matches.toSorted((a, b) => {
    const [rankA, rankB] = [rank(a), rank(b)];
    return rankA[0] - rankB[0] || rankA[1] - rankB[1] || a.name.localeCompare(b.name, 'en', {sensitivity: 'base'});
  });
}
