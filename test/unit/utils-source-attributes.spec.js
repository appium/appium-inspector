import {describe, expect, it} from 'vitest';

import {
  getVisibleSourceAttributes,
  sourceElementMatchesSearch,
} from '../../app/common/renderer/utils/source-attributes.js';
import {IMPORTANT_SOURCE_ATTRS} from '../../app/common/shared/setting-defs.js';

const element = {
  tagName: 'android.widget.EditText',
  attributes: {text: 'Email', hint: 'Enter your email', focused: 'false', 'content-desc': ''},
};

describe('utils/source-attributes.js', () => {
  describe('#getVisibleSourceAttributes', () => {
    it('keeps the default compact view unchanged', () => {
      expect(getVisibleSourceAttributes(element.attributes)).toEqual([['text', 'Email']]);
    });

    it('shows a custom Android hint and hides a removed default attribute', () => {
      expect(getVisibleSourceAttributes(element.attributes, ['hint'])).toEqual([['hint', 'Enter your email']]);
    });

    it('allows an empty selection without falling back to defaults', () => {
      expect(getVisibleSourceAttributes(element.attributes, [])).toEqual([]);
    });

    it('shows all attributes, including empty values, when the full view is enabled', () => {
      expect(getVisibleSourceAttributes(element.attributes, ['hint'], true)).toEqual(
        Object.entries(element.attributes),
      );
    });

    it('can restore the original important attributes', () => {
      expect(getVisibleSourceAttributes(element.attributes, [...IMPORTANT_SOURCE_ATTRS])).toEqual([['text', 'Email']]);
    });
  });

  describe('#sourceElementMatchesSearch', () => {
    it('searches selected custom attribute names and values case-insensitively', () => {
      expect(sourceElementMatchesSearch(element, 'HINT', ['hint'], false)).toBe(true);
      expect(sourceElementMatchesSearch(element, 'ENTER YOUR EMAIL', ['hint'], false)).toBe(true);
    });

    it('does not match hidden attributes, but searches them in the full view', () => {
      expect(sourceElementMatchesSearch(element, 'Enter your email', ['text'], false)).toBe(false);
      expect(sourceElementMatchesSearch(element, 'Enter your email', ['text'], true)).toBe(true);
    });

    it('can search node names when no attributes are selected', () => {
      expect(sourceElementMatchesSearch(element, 'EDITTEXT', [], false)).toBe(true);
      expect(sourceElementMatchesSearch(element, 'Email', [], false)).toBe(false);
    });
  });
});
