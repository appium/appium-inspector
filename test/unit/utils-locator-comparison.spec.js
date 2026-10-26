import {describe, expect, it, vi} from 'vitest';

import {compareLocatorQueries} from '../../app/common/renderer/utils/locator-comparison.js';

const locators = [
  {strategy: 'id', selector: 'first'},
  {strategy: 'xpath', selector: '//Second'},
];

describe('Locator comparison', () => {
  it('waits for the first search before starting the second and preserves each result', async () => {
    let finishFirst;
    const find = vi
      .fn()
      .mockImplementationOnce(() => new Promise((resolve) => (finishFirst = resolve)))
      .mockResolvedValueOnce({elements: [{id: 'second-id'}], executionTime: 23});
    const comparison = compareLocatorQueries(find, locators);
    expect(find).toHaveBeenCalledTimes(1);
    expect(find).toHaveBeenNthCalledWith(1, locators[0]);
    finishFirst({elements: [{id: 'first-id'}, {id: 'another-id'}], executionTime: 0});
    expect(await comparison).toEqual([
      {...locators[0], elementIds: ['first-id', 'another-id'], executionTime: 0},
      {...locators[1], elementIds: ['second-id'], executionTime: 23},
    ]);
    expect(find).toHaveBeenNthCalledWith(2, locators[1]);
  });

  it.each([0, 1])('keeps the other result when locator %i fails', async (failed) => {
    const find = vi.fn(async (locator) => {
      if (locator === locators[failed]) {
        throw new Error('Invalid selector');
      }
      return {elements: [], executionTime: 41};
    });
    const results = await compareLocatorQueries(find, locators);
    expect(find).toHaveBeenCalledTimes(2);
    expect(results[failed]).toEqual({...locators[failed], error: 'Invalid selector'});
    expect(results[1 - failed]).toEqual({...locators[1 - failed], elementIds: [], executionTime: 41});
    expect(results[failed]).not.toHaveProperty('executionTime');
  });

  it('retains exact selector text and converts non-Error rejections to readable failures', async () => {
    const queries = [{strategy: 'id', selector: ' padded id '}, locators[1]];
    const find = vi
      .fn()
      .mockRejectedValueOnce('Driver unavailable')
      .mockResolvedValueOnce({elements: [], executionTime: 8});
    expect(await compareLocatorQueries(find, queries)).toEqual([
      {...queries[0], error: 'Driver unavailable'},
      {...queries[1], elementIds: [], executionTime: 8},
    ]);
    expect(find).toHaveBeenNthCalledWith(1, queries[0]);
  });

  it('does not issue requests for a cancelled comparison', async () => {
    const find = vi.fn();
    expect(await compareLocatorQueries(find, locators, () => false)).toBeNull();
    expect(find).not.toHaveBeenCalled();
  });

  it.each([false, true])(
    'discards an in-flight result and skips the second request after cancellation (reject=%s)',
    async (reject) => {
      let current = true;
      let finish;
      const find = vi.fn(
        () =>
          new Promise((resolve, rejectResult) => {
            finish = () =>
              reject ? rejectResult(new Error('Late failure')) : resolve({elements: [], executionTime: 5});
          }),
      );
      const comparison = compareLocatorQueries(find, locators, () => current);
      current = false;
      finish();
      expect(await comparison).toBeNull();
      expect(find).toHaveBeenCalledTimes(1);
    },
  );
});
