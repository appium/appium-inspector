import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {promises as fs} from 'fs';
import {join} from 'path';

import {parseSource} from '../../app/renderer/lib/webview-helpers';

chai.should();
chai.use(chaiAsPromised);

describe('webview-helpers.js', function () {
  describe('#parseSource', function () {
    it('should parse html to proper xml', async function () {
      const output = parseSource(
        await fs.readFile(join(__dirname, './mocks/appium.page.original.html'), 'utf8'),
      );

      output.should.eql(
        await fs.readFile(join(__dirname, './mocks/appium.page.parsed.html'), 'utf8'),
      );
    });
  });
});
