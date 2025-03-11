import {promises as fs} from 'fs';
import {join} from 'path';
import {describe, expect, it} from 'vitest';

import {parseHtmlSource} from '../../app/common/renderer/utils/webview';

describe('webview-helpers.js', function () {
  describe('#parseHtmlSource', function () {
    it('should parse html to proper xml', async function () {
      const original = await fs.readFile(
        join(__dirname, 'mocks', 'appium.page.original.html'),
        'utf8',
      );
      const parsed = await fs.readFile(join(__dirname, 'mocks', 'appium.page.parsed.html'), 'utf8');
      expect(parseHtmlSource(original)).toEqual(parsed);
    });

    it('should do nothing if the source is already xml', function () {
      const basicXmlSource = `<hierarchy>
        <root>
          <firstA>
            <secondA/>
            <secondB/>
          </firstA>
          <firstB>
            <secondC/>
            <secondD/>
          </firstB>
        </root>
      </hierarchy>`;
      expect(parseHtmlSource(basicXmlSource)).toEqual(basicXmlSource);
    });
  });
});
