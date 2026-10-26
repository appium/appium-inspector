/**
 * Run each locator separately so one command's queue time is not included in
 * another command's measurement. A failed locator does not hide the other result.
 */
export async function compareLocatorQueries(findElements, locators, isCurrent = () => true) {
  const results = [];
  for (const locator of locators) {
    if (!isCurrent()) {
      return null;
    }
    try {
      const {elements, executionTime} = await findElements(locator);
      if (!isCurrent()) {
        return null;
      }
      results.push({...locator, elementIds: elements.map(({id}) => id), executionTime});
    } catch (error) {
      if (!isCurrent()) {
        return null;
      }
      results.push({...locator, error: error?.message || String(error)});
    }
  }
  return results;
}
