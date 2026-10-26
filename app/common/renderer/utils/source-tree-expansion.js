export const SOURCE_EXPANSION_LEVELS = 3;
export const SOURCE_EXPANSION_LIMIT = 50;

/**
 * Open the next few collapsed levels of one branch, with a per-click node limit.
 * Existing expansion state, including other branches, is preserved.
 */
export function expandSourceBranch(node, expandedPaths) {
  const expanded = new Set(expandedPaths);
  let level = node ? [node] : [];
  let levelsLeft = SOURCE_EXPANSION_LEVELS;
  let added = 0;
  let reachedCollapsedLevel = false;

  while (level.length && levelsLeft > 0 && added < SOURCE_EXPANSION_LIMIT) {
    const nextLevel = [];
    for (const current of level) {
      if (!current.children?.length) {
        continue;
      }
      if (!expanded.has(current.key)) {
        expanded.add(current.key);
        reachedCollapsedLevel = true;
        added++;
        if (added === SOURCE_EXPANSION_LIMIT) {
          break;
        }
      }
      for (const child of current.children) {
        nextLevel.push(child);
      }
    }
    if (reachedCollapsedLevel) {
      levelsLeft--;
    }
    level = nextLevel;
  }

  return [...expanded];
}
