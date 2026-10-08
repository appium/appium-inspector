import {describe, expect, it} from 'vitest';

import DotNetNUnitFramework from '../../app/common/renderer/lib/client-frameworks/dotnet-nunit.js';
import JavaJUnit4Framework from '../../app/common/renderer/lib/client-frameworks/java-junit4.js';
import JavaJUnit5Framework from '../../app/common/renderer/lib/client-frameworks/java-junit5.js';
import JsOxygenFramework from '../../app/common/renderer/lib/client-frameworks/js-oxygen.js';
import JsWdIoFramework from '../../app/common/renderer/lib/client-frameworks/js-wdio.js';
import PythonFramework from '../../app/common/renderer/lib/client-frameworks/python.js';
import RobotFramework from '../../app/common/renderer/lib/client-frameworks/robot.js';
import RubyFramework from '../../app/common/renderer/lib/client-frameworks/ruby.js';

const SERVER_URL = 'http://127.0.0.1:4723';
const SERVER_URL_PARTS = {protocol: 'http', hostname: '127.0.0.1', port: '4723', path: '/'};
const CAPS = {
  platformName: 'Android',
  'appium:app': null,
  'goog:chromeOptions': {args: ['--headless'], 'mobile-emulation': null},
};
const SCRIPT_ARG = {elementId: null, 'some-key': 'value'};

function buildFramework(Framework) {
  const framework = new Framework(SERVER_URL, SERVER_URL_PARTS, CAPS);
  framework.actions = [{action: 'executeScript', params: [null, null, 'mobile: test', [SCRIPT_ARG]]}];
  return framework;
}

describe('client-frameworks', function () {
  describe('with null values and non-identifier keys', function () {
    it('should generate Python code using None', function () {
      const code = buildFramework(PythonFramework).getCodeString(true);
      expect(code).toContain(
        '"appium:app": None,\n\t"goog:chromeOptions": {"args": ["--headless"], "mobile-emulation": None}',
      );
      expect(code).toContain(`driver.execute_script('mobile: test', {"elementId": None, "some-key": "value"})`);
      expect(code).not.toContain('null');
    });

    it('should generate Ruby code using nil and quoted keys', function () {
      const code = buildFramework(RubyFramework).getCodeString(true);
      expect(code).toContain('caps["appium:app"] = nil');
      expect(code).toContain('caps["goog:chromeOptions"] = {args: ["--headless"], "mobile-emulation": nil}');
      expect(code).toContain(`driver.execute_script 'mobile: test', {elementId: nil, "some-key": "value"}`);
    });

    it('should generate Java code using null', function () {
      for (const Framework of [JavaJUnit4Framework, JavaJUnit5Framework]) {
        const code = buildFramework(Framework).getCodeString(true);
        expect(code).toContain('.amend("appium:app", null)');
        expect(code).toContain(
          '.amend("goog:chromeOptions", Map.ofEntries(Map.entry("args", {"--headless"}), Map.entry("mobile-emulation", null)))',
        );
        expect(code).toContain(
          'driver.executeScript("mobile: test", Map.ofEntries(Map.entry("elementId", null), Map.entry("some-key", "value")));',
        );
      }
    });

    it('should generate C# code using null', function () {
      const code = buildFramework(DotNetNUnitFramework).getCodeString(true);
      expect(code).toContain('options.AddAdditionalAppiumOption("appium:app", null);');
      expect(code).toContain(
        'options.AddAdditionalAppiumOption("goog:chromeOptions", new Dictionary<string, dynamic> {{"args", {"--headless"}}, {"mobile-emulation", null}});',
      );
      expect(code).toContain(
        '_driver.ExecuteScript("mobile: test", new Dictionary<string, dynamic> {{"elementId", null}, {"some-key", "value"}});',
      );
    });

    it('should generate Robot code using ${None}', function () {
      const code = buildFramework(RobotFramework).getCodeString(true);
      expect(code).toContain('appium:app=${None}');
      expect(code).toContain('Create Dictionary    elementId=${None}    some-key=value');
    });

    it('should generate JavaScript code using null', function () {
      for (const Framework of [JsWdIoFramework, JsOxygenFramework]) {
        const code = buildFramework(Framework).getCodeString(true);
        expect(code).toContain('"appium:app": null');
        expect(code).toContain('"mobile-emulation": null');
      }
    });
  });

  describe('without null values', function () {
    it('should quote Ruby hash keys that are not identifiers', function () {
      const framework = new RubyFramework(SERVER_URL, SERVER_URL_PARTS, {
        'goog:chromeOptions': {mobileEmulation: {'device-name': 'Pixel 7'}},
      });
      expect(framework.getCodeString(true)).toContain(
        'caps["goog:chromeOptions"] = {mobileEmulation: {"device-name": "Pixel 7"}}',
      );
    });

    it('should keep Ruby identifier keys unquoted', function () {
      const framework = new RubyFramework(SERVER_URL, SERVER_URL_PARTS, {'appium:options': {noReset: true}});
      expect(framework.getCodeString(true)).toContain('caps["appium:options"] = {noReset: true}');
    });
  });
});
