import {promises as fs} from 'fs';
import {join} from 'path';
import {describe, expect, it} from 'vitest';

import {parseSource} from '../../app/common/renderer/lib/webview-helpers';

describe('webview-helpers.js', function () {
  describe('#parseSource', function () {
    it('should parse html to proper xml', async function () {
      const original = await fs.readFile(
        join(__dirname, 'mocks', 'appium.page.original.html'),
        'utf8',
      );
      const parsed = await fs.readFile(join(__dirname, 'mocks', 'appium.page.parsed.html'), 'utf8');
      expect(parseSource(original)).toEqual(parsed);
    });
  });
});
