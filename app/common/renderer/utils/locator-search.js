export const MAX_LOCATOR_SEARCH_HISTORY = 20;

/**
 * Prepends a strategy and selector pair to the search history,
 * deduplicating matching entries and capping the list length.
 */
export function addLocatorSearchHistoryEntry(
  searchHistory = [],
  {strategy, selector} = {},
  maxEntries = MAX_LOCATOR_SEARCH_HISTORY,
) {
  const currentHistory = Array.isArray(searchHistory) ? searchHistory : [];
  if (!strategy || !selector) {
    return currentHistory;
  }
  const key = JSON.stringify([strategy, selector]);
  const filteredHistory = currentHistory.filter((entry) => entry.key !== key);
  return [{key, strategy, selector}, ...filteredHistory].slice(0, maxEntries);
}
