import {IMPORTANT_SOURCE_ATTRS} from '../../shared/setting-defs.js';

/** Returns the attributes displayed in a source tree node. */
export function getVisibleSourceAttributes(attributes, importantAttrs = IMPORTANT_SOURCE_ATTRS, showAll = false) {
  return Object.entries(attributes).filter(([name, value]) => showAll || (importantAttrs.includes(name) && value));
}

/** Searches the tag and visible attributes, matching what the source tree displays. */
export function sourceElementMatchesSearch(element, value, importantAttrs, showAll) {
  const attributeTexts = getVisibleSourceAttributes(element.attributes, importantAttrs, showAll).map(
    ([name, attrValue]) => name + attrValue,
  );
  return (element.tagName + attributeTexts).toLowerCase().includes(value.toLowerCase());
}
