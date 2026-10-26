export const MAX_SOURCE_EXPANSION_DEPTH = 10;

export function normalizeSourceExpansionDepth(depth) {
  return Number.isInteger(depth) && depth >= 1 && depth <= MAX_SOURCE_EXPANSION_DEPTH ? depth : 1;
}

/**
 * Open a configured number of levels starting at the clicked branch.
 * Existing expansion state, including other branches, is preserved.
 */
export function expandSourceBranch(node, expandedPaths, depth = 1) {
  const expanded = new Set(expandedPaths);
  let level = node ? [node] : [];
  for (let levelsLeft = normalizeSourceExpansionDepth(depth); level.length && levelsLeft > 0; levelsLeft--) {
    const nextLevel = [];
    for (const current of level) {
      if (!current.children?.length) {
        continue;
      }
      expanded.add(current.key);
      if (levelsLeft > 1) {
        for (const child of current.children) {
          nextLevel.push(child);
        }
      }
    }
    level = nextLevel;
  }

  return [...expanded];
}
