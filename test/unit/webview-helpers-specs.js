import {readFileSync} from 'fs';
import {join} from 'path';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {parseSource} from '../../app/renderer/lib/webview-helpers';

chai.use(chaiAsPromised);

describe('webview-helpers.js', function () {
  describe('#parseSource', function () {
    it('should parse html to proper xml', function () {
      const output = parseSource(
        readFileSync(
          join(__dirname, './mocks/appium.page.original.html'),
          'utf8',
        ));

      output.should.eql(
        readFileSync(
          join(__dirname, './mocks/appium.page.parsed.html'),
          'utf8',
        )
      );
    });
  });
});
