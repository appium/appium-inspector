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
  const filteredHistory = currentHistory.filter((entry) => entry.strategy !== strategy || entry.selector !== selector);
  return [{strategy, selector}, ...filteredHistory].slice(0, maxEntries);
}
