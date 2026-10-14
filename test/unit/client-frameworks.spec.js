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
      expect(code).toContain('caps["goog:chromeOptions"] = {args: ["--headless"], \'mobile-emulation\': nil}');
      expect(code).toContain(`driver.execute_script 'mobile: test', {elementId: nil, 'some-key': "value"}`);
    });

    it('should generate Java code using null', function () {
      for (const Framework of [JavaJUnit4Framework, JavaJUnit5Framework]) {
        const code = buildFramework(Framework).getCodeString(true);
        expect(code).toContain('.amend("appium:app", null)');
        expect(code).toContain(
          '.amend("goog:chromeOptions", new HashMap<String, Object>() {{ put("args", Arrays.asList(new Object[] {"--headless"})); put("mobile-emulation", null); }})',
        );
        expect(code).toContain(
          'driver.executeScript("mobile: test", new HashMap<String, Object>() {{ put("elementId", null); put("some-key", "value"); }});',
        );
        expect(code).not.toContain('Map.entry("mobile-emulation", null)');
      }
    });

    it('should keep Map.ofEntries for Java maps without null values', function () {
      const framework = new JavaJUnit5Framework(SERVER_URL, SERVER_URL_PARTS, {
        'appium:options': {noReset: true, nested: {key: 'value'}},
      });
      expect(framework.getCodeString(true)).toContain(
        '.amend("appium:options", Map.ofEntries(Map.entry("noReset", true), Map.entry("nested", Map.ofEntries(Map.entry("key", "value")))))',
      );
    });

    it('should generate C# code using null', function () {
      const code = buildFramework(DotNetNUnitFramework).getCodeString(true);
      expect(code).toContain('options.AddAdditionalAppiumOption("appium:app", null);');
      expect(code).toContain(
        'options.AddAdditionalAppiumOption("goog:chromeOptions", new Dictionary<string, dynamic> {{"args", new object[] {"--headless"}}, {"mobile-emulation", null}});',
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
        `caps["goog:chromeOptions"] = {mobileEmulation: {'device-name': "Pixel 7"}}`,
      );
    });

    it('should keep Ruby identifier keys unquoted', function () {
      const framework = new RubyFramework(SERVER_URL, SERVER_URL_PARTS, {'appium:options': {noReset: true}});
      expect(framework.getCodeString(true)).toContain('caps["appium:options"] = {noReset: true}');
    });
  });

  describe('nested collection values', function () {
    it('should render nullable Java lists in expression contexts for both JUnit variants', function () {
      for (const Framework of [JavaJUnit4Framework, JavaJUnit5Framework]) {
        const framework = new Framework(SERVER_URL, SERVER_URL_PARTS, {});
        expect(framework.getJavaVal([null])).toBe('Arrays.asList(new Object[] {null})');
        expect(framework.getJavaVal([])).toBe('Arrays.asList(new Object[] {})');
        expect(framework.getJavaVal({items: [null, {nested: [true, 7]}]})).toBe(
          'Map.ofEntries(Map.entry("items", Arrays.asList(new Object[] {null, Map.ofEntries(Map.entry("nested", Arrays.asList(new Object[] {true, 7})))})))',
        );
      }
    });

    it('should render heterogeneous C# arrays as nullable object array expressions', function () {
      const framework = new DotNetNUnitFramework(SERVER_URL, SERVER_URL_PARTS, {});
      expect(framework.getCSharpVal([null, {items: [true, 7]}])).toBe(
        'new object[] {null, new Dictionary<string, dynamic> {{"items", new object[] {true, 7}}}}',
      );
      expect(framework.getCSharpVal([])).toBe('new object[] {}');
    });

    it('should define nested Robot capability lists and dictionaries before opening the session', function () {
      const framework = new RobotFramework(SERVER_URL, SERVER_URL_PARTS, {
        'goog:chromeOptions': {args: ['--headless', null], extra: {flag: true}, none: null},
      });
      const code = framework.getCodeString(true);
      expect(code).toContain('${value0} =    Create List    --headless    ${None}');
      expect(code).toContain('${value1} =    Create Dictionary    flag=${True}');
      expect(code).toContain('${value2} =    Create Dictionary    args=${value0}    extra=${value1}    none=${None}');
      expect(code).toContain('goog:chromeOptions=${value2}');
      expect(code.indexOf('Create List')).toBeLessThan(code.indexOf('Open Application'));
      expect(code).not.toContain('[object Object]');
      expect(framework.getCodeString(true)).toBe(code);
    });

    it('should build nested Robot script arguments recursively without flattening typed values', function () {
      const framework = new RobotFramework(SERVER_URL, SERVER_URL_PARTS, {});
      const code = framework.codeFor_executeScriptWithArgs('mobile: test', [{nested: {items: [null, true, 7]}}]);
      expect(code).toContain('${value0} =    Create List    ${None}    ${True}    ${7}');
      expect(code).toContain('${value1} =    Create Dictionary    items=${value0}');
      expect(code).toContain('&{scriptArgument} =    Create Dictionary    nested=${value1}');
      expect(code).toContain('Execute Script    mobile: test    ${scriptArgument}');
      expect(code).not.toContain('[object Object]');
    });
  });

  describe('Ruby hash key escaping', function () {
    it('should keep identifier keys bare and single-quote other keys', function () {
      const framework = new RubyFramework(SERVER_URL, SERVER_URL_PARTS, {});
      expect(framework.getRubyKey('noReset')).toBe('noReset');
      expect(framework.getRubyKey('_private')).toBe('_private');
      // A double-quoted Ruby label would evaluate `#{...}` as interpolation.
      expect(framework.getRubyKey('#{$key_evaluated = true}')).toBe(String.raw`'#{$key_evaluated = true}'`);
      // Single-quoted Ruby strings only escape backslashes and apostrophes.
      expect(framework.getRubyKey("a'b")).toBe(String.raw`'a\'b'`);
      expect(framework.getRubyKey('c\\d')).toBe(String.raw`'c\\d'`);
    });

    it('should emit interpolation-looking keys as literal single-quoted symbols', function () {
      const framework = new RubyFramework(SERVER_URL, SERVER_URL_PARTS, {
        'goog:chromeOptions': {'#{$key_evaluated = true}': 'value'},
      });
      const code = framework.getCodeString(true);
      expect(code).toContain(String.raw`caps["goog:chromeOptions"] = {'#{$key_evaluated = true}': "value"}`);
      // The removed JSON.stringify path emitted a double-quoted label, which Ruby evaluates.
      expect(code).not.toContain('"#{$key_evaluated = true}":');
    });

    it('should escape apostrophes and backslashes in generated Ruby keys', function () {
      const framework = new RubyFramework(SERVER_URL, SERVER_URL_PARTS, {
        'goog:chromeOptions': {"a'b": 'v1', 'c\\d': 'v2'},
      });
      expect(framework.getCodeString(true)).toContain(
        String.raw`caps["goog:chromeOptions"] = {'a\'b': "v1", 'c\\d': "v2"}`,
      );
    });

    it.each([
      ['line\r\nkey', String.raw`"line\r\nkey"`],
      ['line\rkey', String.raw`"line\rkey"`],
      ['line\nkey', String.raw`"line\nkey"`],
      ["line\r\n\\#{$key_evaluated = true}'", String.raw`"line\r\n\\\#{$key_evaluated = true}'"`],
    ])('should preserve line-break bytes without enabling interpolation: %j', function (key, expected) {
      const framework = new RubyFramework(SERVER_URL, SERVER_URL_PARTS, {});
      expect(framework.getRubyKey(key)).toBe(expected);
    });

    it('should preserve line-break keys inside nested Ruby hashes and arrays', function () {
      const framework = new RubyFramework(SERVER_URL, SERVER_URL_PARTS, {
        'goog:chromeOptions': {nested: [{'line\r\n#{$key_evaluated = true}': null}]},
      });
      expect(framework.getCodeString(true)).toContain(
        String.raw`caps["goog:chromeOptions"] = {nested: [{"line\r\n\#{$key_evaluated = true}": nil}]}`,
      );
    });
  });
});
