import {describe, expect, it} from 'vitest';

import {
  addLocatorSearchHistoryEntry,
  MAX_LOCATOR_SEARCH_HISTORY,
} from '../../app/common/renderer/utils/locator-search.js';

describe('utils/locator-search.js', () => {
  describe('#addLocatorSearchHistoryEntry', () => {
    it('adds a new strategy and selector entry to the front of the history', () => {
      const history = [{key: '["id","first"]', strategy: 'id', selector: 'first'}];
      expect(addLocatorSearchHistoryEntry(history, {strategy: 'xpath', selector: '//Button'})).toEqual([
        {key: '["xpath","//Button"]', strategy: 'xpath', selector: '//Button'},
        {key: '["id","first"]', strategy: 'id', selector: 'first'},
      ]);
      expect(history).toEqual([{key: '["id","first"]', strategy: 'id', selector: 'first'}]);
    });

    it('moves a duplicate strategy and selector pair to the front without duplicating it', () => {
      const history = [
        {key: '["id","first"]', strategy: 'id', selector: 'first'},
        {key: '["xpath","//Button"]', strategy: 'xpath', selector: '//Button'},
        {key: '["accessibility id","login"]', strategy: 'accessibility id', selector: 'login'},
      ];
      expect(addLocatorSearchHistoryEntry(history, {strategy: 'xpath', selector: '//Button'})).toEqual([
        {key: '["xpath","//Button"]', strategy: 'xpath', selector: '//Button'},
        {key: '["id","first"]', strategy: 'id', selector: 'first'},
        {key: '["accessibility id","login"]', strategy: 'accessibility id', selector: 'login'},
      ]);
    });

    it('preserves entries with the same selector when the strategy differs', () => {
      const history = [{key: '["id","login"]', strategy: 'id', selector: 'login'}];
      expect(addLocatorSearchHistoryEntry(history, {strategy: 'accessibility id', selector: 'login'})).toEqual([
        {key: '["accessibility id","login"]', strategy: 'accessibility id', selector: 'login'},
        {key: '["id","login"]', strategy: 'id', selector: 'login'},
      ]);
    });

    it('ignores entries with an empty strategy or selector', () => {
      const history = [{key: '["id","first"]', strategy: 'id', selector: 'first'}];
      expect(addLocatorSearchHistoryEntry(history, {strategy: '', selector: 'first'})).toEqual(history);
      expect(addLocatorSearchHistoryEntry(history, {strategy: 'id', selector: ''})).toEqual(history);
      expect(addLocatorSearchHistoryEntry(history)).toEqual(history);
    });

    it('caps the history at MAX_LOCATOR_SEARCH_HISTORY entries', () => {
      const history = Array.from({length: MAX_LOCATOR_SEARCH_HISTORY}, (_, index) => ({
        key: JSON.stringify(['id', `item-${index}`]),
        strategy: 'id',
        selector: `item-${index}`,
      }));
      const updated = addLocatorSearchHistoryEntry(history, {strategy: 'xpath', selector: '//New'});
      expect(updated).toHaveLength(MAX_LOCATOR_SEARCH_HISTORY);
      expect(updated[0]).toEqual({key: '["xpath","//New"]', strategy: 'xpath', selector: '//New'});
      expect(updated.at(-1)).toEqual({
        key: JSON.stringify(['id', `item-${MAX_LOCATOR_SEARCH_HISTORY - 2}`]),
        strategy: 'id',
        selector: `item-${MAX_LOCATOR_SEARCH_HISTORY - 2}`,
      });
    });
  });
});
