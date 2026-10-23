import {describe, expect, it} from 'vitest';

import {
  escapeClassChainString,
  escapeJavaString,
  escapePredicateString,
  getEmbeddedLocatorCandidates,
  toXPathLiteral,
} from '../../../app/common/renderer/utils/locator-generation/embedded-candidates.js';

const selectedElement = (attributes = {}, tagName = 'node') => ({
  path: '0',
  tagName,
  attributes,
});

describe('embedded locator candidates', function () {
  it('generates ranked Android alternatives without collapsing repeated strategies', function () {
    const source = `<hierarchy>
      <android.widget.Button resource-id="com.example:id/login" content-desc="Log in" text="Continue" class="android.widget.Button" />
      <android.widget.Button resource-id="com.example:id/cancel" content-desc="Cancel" text="Continue" class="android.widget.Button" />
    </hierarchy>`;
    const candidates = getEmbeddedLocatorCandidates(
      selectedElement(
        {
          'resource-id': 'com.example:id/login',
          'content-desc': 'Log in',
          text: 'Continue',
          class: 'android.widget.Button',
        },
        'android.widget.Button',
      ),
      source,
      true,
      'uiautomator2',
    );

    expect(candidates[0]).toMatchObject({
      strategy: 'id',
      selector: 'com.example:id/login',
      unique: true,
      source: 'resource-id',
    });
    expect(candidates.filter(({strategy}) => strategy === '-android uiautomator').length).toBeGreaterThan(5);
    expect(candidates.filter(({strategy}) => strategy === 'xpath').length).toBeGreaterThan(5);
    expect(candidates.find(({label}) => label === 'UIAutomator text')).toMatchObject({unique: false});
    expect(candidates.find(({label}) => label === 'UIAutomator class + text')).toMatchObject({
      strategy: '-android uiautomator',
      unique: false,
    });
    expect(candidates.at(-1)).toMatchObject({structural: true, strategy: 'xpath', unique: true});
    expect(new Set(candidates.map(({id}) => id)).size).toBe(candidates.length);
    expect(new Set(candidates.map(({strategy, selector}) => `${strategy}\0${selector}`)).size).toBe(candidates.length);
  });

  it('uses an XPath for Compose-style resource ids that are unsafe for direct id lookup', function () {
    const candidates = getEmbeddedLocatorCandidates(
      selectedElement({'resource-id': 'login button'}, 'android.view.View'),
      '<hierarchy><android.view.View resource-id="login button" /></hierarchy>',
      true,
      'uiautomator2',
    );

    expect(candidates.some(({strategy}) => strategy === 'id')).toBe(false);
    expect(candidates).toContainEqual(
      expect.objectContaining({
        label: 'XPath resource-id exact',
        selector: "//android.view.View[@resource-id='login button']",
        unique: true,
      }),
    );
  });

  it('preserves class constraints in generic Android node XPath candidates', function () {
    const source = `<hierarchy>
      <node class="android.widget.Button" text="Same" />
      <node class="android.widget.TextView" text="Same" />
    </hierarchy>`;
    const candidates = getEmbeddedLocatorCandidates(
      selectedElement({class: 'android.widget.Button', text: 'Same'}),
      source,
      true,
      'uiautomator2',
    );

    expect(candidates.find(({label}) => label === 'XPath class fallback')).toMatchObject({
      selector: "//*[@class='android.widget.Button']",
      unique: true,
    });
    expect(candidates.find(({label}) => label === 'XPath class + text')).toMatchObject({
      selector: "//*[@class='android.widget.Button' and @text='Same']",
      unique: true,
    });
  });

  it('escapes Java and XPath literals and keeps stable candidate ids', function () {
    const value = `Say "go"\\now\nO'Reilly`;
    const source = `<hierarchy><android.widget.TextView text="Say &quot;go&quot;\\now&#10;O'Reilly" /></hierarchy>`;
    const first = getEmbeddedLocatorCandidates(
      selectedElement({text: value}, 'android.widget.TextView'),
      source,
      true,
      'uiautomator2',
    );
    const second = getEmbeddedLocatorCandidates(
      selectedElement({text: value}, 'android.widget.TextView'),
      source,
      true,
      'uiautomator2',
    );

    expect(escapeJavaString(value)).toBe(`Say \\"go\\"\\\\now\\nO'Reilly`);
    expect(toXPathLiteral(`a'b"c`)).toBe(`concat('a', "'", 'b"c')`);
    expect(first.find(({label}) => label === 'UIAutomator text').selector).toContain(
      `text("Say \\"go\\"\\\\now\\nO'Reilly")`,
    );
    expect(first.find(({label}) => label === 'XPath text exact').selector).toContain('concat(');
    expect(first.map(({id}) => id)).toEqual(second.map(({id}) => id));
  });

  it('generates escaped iOS accessibility, predicate, class-chain, XPath, and type candidates', function () {
    const source = `<AppiumAUT>
      <XCUIElementTypeTextField type="XCUIElementTypeTextField" name="O'Reilly &quot;user&quot;" label="Username" value="typed" />
      <XCUIElementTypeTextField type="XCUIElementTypeTextField" name="other" label="Username" value="empty" />
    </AppiumAUT>`;
    const candidates = getEmbeddedLocatorCandidates(
      selectedElement(
        {
          type: 'XCUIElementTypeTextField',
          name: `O'Reilly "user"`,
          label: 'Username',
          value: 'typed',
        },
        'XCUIElementTypeTextField',
      ),
      source,
      true,
      'xcuitest',
    );

    expect(candidates[0]).toMatchObject({
      strategy: 'accessibility id',
      selector: `O'Reilly "user"`,
      unique: true,
    });
    expect(candidates.filter(({strategy}) => strategy === '-ios predicate string').length).toBeGreaterThan(4);
    expect(candidates.filter(({strategy}) => strategy === '-ios class chain').length).toBe(3);
    expect(candidates.find(({label}) => label === 'Predicate name exact').selector).toBe(`name == 'O\\'Reilly "user"'`);
    expect(candidates.find(({label}) => label === 'Class chain type + name').selector).toContain(
      `name == 'O\\'Reilly "user"'`,
    );
    expect(candidates.find(({label}) => label === 'XPath name').selector).toBe(
      `//XCUIElementTypeTextField[@name=concat('O', "'", 'Reilly "user"')]`,
    );
    expect(candidates.find(({label}) => label === 'Class name (type)')).toMatchObject({
      selector: 'XCUIElementTypeTextField',
      unique: false,
      reason: 'Editable control type',
    });
    expect(candidates.at(-1).structural).toBe(true);
  });

  it('escapes predicate and class-chain delimiters independently', function () {
    expect(escapePredicateString("a\\b'c")).toBe("a\\\\b\\'c");
    expect(escapeClassChainString("a`b'c")).toBe("a\\`b\\'c");
  });

  it('does not alter unsupported, web, or non-embedded candidate generation paths', function () {
    const element = selectedElement({id: 'web-id'});
    expect(getEmbeddedLocatorCandidates(element, '<root><node id="web-id" /></root>', false, 'xcuitest')).toEqual([]);
    expect(getEmbeddedLocatorCandidates(element, '<root><node id="web-id" /></root>', true, 'espresso')).toEqual([]);
  });
});
