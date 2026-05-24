import {LOCATOR_STRATEGIES as STRATS} from '../../constants/session-inspector.js';
import {buildAttributeXPath, buildUiAutomatorSelector} from './locator-generator.js';

/**
 * Build concrete suggestions that improve weak or risky locators.
 *
 * @param {object} params
 * @param {object} params.bestLocator
 * @param {object} params.selectedElement
 * @returns {Array<object>}
 */
export function getSmartLocatorRepairSuggestions({bestLocator, selectedElement}) {
  const attributes = selectedElement?.attributes || {};
  const suggestions = [];

  if (!attributes['resource-id'] && !attributes.id) {
    suggestions.push({
      key: 'add-resource-id',
      title: 'Ask developers to add a stable resource-id.',
      detail:
        'A unique resource-id is usually more stable than text, class name, or hierarchy XPath.',
      suggestedValue: buildSuggestedResourceId(attributes),
    });
  }

  if (!attributes['content-desc'] && !attributes.name && !attributes['accessibility-id']) {
    suggestions.push({
      key: 'add-accessibility-id',
      title: 'Ask developers to add an accessibility id.',
      detail: 'Accessibility IDs are concise and are designed for automation and accessibility.',
      suggestedValue: buildSuggestedAccessibilityId(attributes),
    });
  }

  const textAttribute = getTextAttribute(attributes);
  if (textAttribute && attributes.class) {
    suggestions.push({
      key: 'text-class-xpath',
      title: 'Make the text XPath more specific with class.',
      detail: 'Combining text and class can repair a text locator that matches multiple elements.',
      strategy: STRATS.XPATH,
      value: `//*[@${textAttribute.name}=${textAttribute.xpathValue} and @class=${quoteForXPath(
        attributes.class,
      )}]`,
    });
  }

  if (textAttribute && attributes.class) {
    const uiSelector = buildUiAutomatorSelector(textAttribute.name, textAttribute.value);
    suggestions.push({
      key: 'text-class-uiautomator',
      title: 'Use Android UIAutomator with text and class.',
      detail: 'This keeps the locator Android-native while reducing false matches.',
      strategy: STRATS.UIAUTOMATOR,
      value: `${uiSelector}.className(${JSON.stringify(attributes.class)})`,
    });
  }

  if (bestLocator?.strategy === STRATS.XPATH && bestLocator.value.length > 80 && textAttribute) {
    suggestions.push({
      key: 'shorten-xpath',
      title: 'Replace hierarchy XPath with an attribute XPath.',
      detail: 'Attribute XPath is shorter and less sensitive to layout nesting changes.',
      strategy: STRATS.XPATH,
      value: buildAttributeXPath(textAttribute.name, textAttribute.value),
    });
  }

  if (bestLocator?.runtime?.error || bestLocator?.runtime?.matchCount === 0) {
    suggestions.push({
      key: 'runtime-refresh-context',
      title: 'Refresh source and verify the current context.',
      detail:
        'Runtime validation failed, so the page source may be stale or the locator may belong to another context.',
    });
  }

  return uniqueSuggestions(suggestions).slice(0, 4);
}

function buildSuggestedResourceId(attributes) {
  const packageName = attributes.package || 'com.example.app';
  const name = toLocatorName(attributes.text || attributes['content-desc'] || attributes.class);
  return `${packageName}:id/${name || 'target_element'}`;
}

function buildSuggestedAccessibilityId(attributes) {
  return (
    toLocatorName(attributes.text || attributes['resource-id'] || attributes.class) ||
    'target_element'
  );
}

function getTextAttribute(attributes) {
  for (const name of ['text', 'label', 'value']) {
    if (attributes[name]) {
      return {name, value: attributes[name], xpathValue: quoteForXPath(attributes[name])};
    }
  }
  return null;
}

function quoteForXPath(value) {
  const stringValue = String(value);
  if (!stringValue.includes("'")) {
    return `'${stringValue}'`;
  }
  if (!stringValue.includes('"')) {
    return `"${stringValue}"`;
  }
  return `concat(${stringValue
    .split("'")
    .map((part) => `'${part}'`)
    .join(', "\'", ')})`;
}

function toLocatorName(value) {
  return String(value || '')
    .split(/[:/.]/)
    .at(-1)
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

function uniqueSuggestions(suggestions) {
  const seen = new Set();
  return suggestions.filter((suggestion) => {
    const key = `${suggestion.strategy || suggestion.key}:${suggestion.value || suggestion.suggestedValue || ''}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
