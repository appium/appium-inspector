import {describe, expect, it} from 'vitest';

import {DRIVERS} from '../../app/common/renderer/constants/common.js';
import {LOCATOR_STRATEGIES as STRATS} from '../../app/common/renderer/constants/session-inspector.js';
import {
  formatLocatorForAppiumBy,
  getLocatorCodeSamples,
} from '../../app/common/renderer/utils/smart-locators/locator-code-sample.js';
import {
  buildAttributeXPath,
  generateSmartLocatorCandidates,
  quoteXPathLiteral,
} from '../../app/common/renderer/utils/smart-locators/locator-generator.js';
import {getSmartLocatorRepairSuggestions} from '../../app/common/renderer/utils/smart-locators/locator-repair.js';
import {
  applyRuntimeValidationResult,
  getSmartLocatorMatchCount,
  rankSmartLocators,
  scoreSmartLocator,
} from '../../app/common/renderer/utils/smart-locators/locator-scoring.js';
import {generatePageObject} from '../../app/common/renderer/utils/smart-locators/page-object-generator.js';

describe('utils/smart-locators', function () {
  const selectedElement = {
    tagName: 'android.widget.Button',
    path: '0.0',
    attributes: {
      'resource-id': 'com.example.app:id/login_button',
      'content-desc': 'login_button',
      text: 'Login',
      class: 'android.widget.Button',
      enabled: 'true',
      displayed: 'true',
    },
    strategyMap: [
      [STRATS.ID, 'com.example.app:id/login_button'],
      [STRATS.XPATH, '//*[@resource-id="com.example.app:id/login_button"]'],
    ],
  };

  const sourceXML = `<hierarchy>
    <android.widget.FrameLayout>
      <android.widget.Button
        resource-id="com.example.app:id/login_button"
        content-desc="login_button"
        text="Login"
        class="android.widget.Button"
        enabled="true"
        displayed="true" />
      <android.widget.Button
        resource-id="com.example.app:id/cancel_button"
        text="Cancel"
        class="android.widget.Button"
        enabled="true"
        displayed="true" />
    </android.widget.FrameLayout>
  </hierarchy>`;

  describe('#quoteXPathLiteral', function () {
    it('should quote XPath literals containing single and double quotes', function () {
      expect(quoteXPathLiteral('Login')).toBe("'Login'");
      expect(quoteXPathLiteral(`Bob's Login`)).toBe(`"Bob's Login"`);
      expect(quoteXPathLiteral(`Bob's "Login"`)).toBe(`concat('Bob', "'", 's "Login"')`);
    });
  });

  describe('#generateSmartLocatorCandidates', function () {
    it('should generate simple, text, class, XPath, and Android UIAutomator candidates', function () {
      const candidates = generateSmartLocatorCandidates(selectedElement, {
        automationName: DRIVERS.UIAUTOMATOR2,
      });

      expect(candidates).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            strategy: STRATS.ACCESSIBILITY_ID,
            value: 'login_button',
          }),
          expect.objectContaining({
            strategy: STRATS.ID,
            value: 'com.example.app:id/login_button',
          }),
          expect.objectContaining({
            strategy: STRATS.UIAUTOMATOR,
            value: 'new UiSelector().resourceId("com.example.app:id/login_button")',
          }),
          expect.objectContaining({
            strategy: STRATS.XPATH,
            value: buildAttributeXPath('text', 'Login'),
            isTextBased: true,
          }),
          expect.objectContaining({
            strategy: STRATS.CLASS_NAME,
            value: 'android.widget.Button',
          }),
        ]),
      );
    });

    it('should merge duplicate generated and suggested locators', function () {
      const candidates = generateSmartLocatorCandidates(selectedElement);
      const idCandidates = candidates.filter(
        ({strategy, value}) =>
          strategy === STRATS.ID && value === 'com.example.app:id/login_button',
      );

      expect(idCandidates).toHaveLength(1);
      expect(idCandidates[0].source).toBe('suggested');
    });
  });

  describe('#getSmartLocatorMatchCount', function () {
    it('should count attribute, XPath, and class matches from the current source', function () {
      expect(
        getSmartLocatorMatchCount(
          {
            strategy: STRATS.ID,
            value: 'com.example.app:id/login_button',
            match: {
              type: 'attribute',
              attributeName: 'resource-id',
              attributeValue: 'com.example.app:id/login_button',
            },
          },
          sourceXML,
        ),
      ).toBe(1);
      expect(
        getSmartLocatorMatchCount(
          {
            strategy: STRATS.CLASS_NAME,
            value: 'android.widget.Button',
            match: {
              type: 'attribute',
              attributeName: 'class',
              attributeValue: 'android.widget.Button',
            },
          },
          sourceXML,
        ),
      ).toBe(2);
      expect(
        getSmartLocatorMatchCount(
          {
            strategy: STRATS.XPATH,
            value: '//*[@text="Missing"]',
            match: {type: 'xpath'},
          },
          sourceXML,
        ),
      ).toBe(0);
    });
  });

  describe('#rankSmartLocators', function () {
    it('should rank stable unique locators above text, class name, and hierarchy XPath', function () {
      const rankedLocators = rankSmartLocators({
        selectedElement: {
          ...selectedElement,
          strategyMap: [
            ...selectedElement.strategyMap,
            [
              STRATS.XPATH,
              '/hierarchy/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.Button',
            ],
          ],
        },
        sourceXML,
        automationName: DRIVERS.UIAUTOMATOR2,
      });

      expect(rankedLocators[0]).toEqual(
        expect.objectContaining({
          strategy: STRATS.ACCESSIBILITY_ID,
          score: 100,
          matchCount: 1,
          status: 'Recommended',
        }),
      );

      const idLocator = rankedLocators.find(({strategy}) => strategy === STRATS.ID);
      expect(idLocator).toEqual(
        expect.objectContaining({
          score: 100,
          matchCount: 1,
        }),
      );

      const classNameLocator = rankedLocators.find(({strategy}) => strategy === STRATS.CLASS_NAME);
      expect(classNameLocator.score).toBeLessThan(45);
      expect(classNameLocator.warnings).toContain('Matches 2 elements on the current screen.');

      const hierarchyXPath = rankedLocators.find(({value}) => value.startsWith('/hierarchy/'));
      expect(hierarchyXPath.score).toBeLessThan(30);
      expect(hierarchyXPath.warnings).toContain(
        'Hierarchy XPath depends on the exact screen structure.',
      );
    });

    it('should penalize dynamic text values', function () {
      const dynamicTextScore = scoreSmartLocator(
        {
          strategy: STRATS.XPATH,
          label: 'Text XPath',
          value: '//*[@text="$12.99"]',
          sourceAttribute: 'text',
          sourceValue: '$12.99',
          match: {type: 'xpath'},
          isTextBased: true,
        },
        {
          selectedElement: {attributes: {text: '$12.99'}},
          sourceDoc: sourceXML,
        },
      );

      expect(dynamicTextScore.score).toBeLessThan(60);
      expect(dynamicTextScore.warnings).toContain('The locator value looks dynamic.');
    });

    it('should adjust score with runtime validation results', function () {
      const locator = scoreSmartLocator(
        {
          strategy: STRATS.XPATH,
          label: 'Text XPath',
          value: '//*[@text="Login"]',
          sourceAttribute: 'text',
          sourceValue: 'Login',
          match: {type: 'xpath'},
          isTextBased: true,
        },
        {
          selectedElement,
          sourceDoc: sourceXML,
        },
      );

      const validatedLocator = applyRuntimeValidationResult(locator, {
        executionTime: 25,
        matchCount: 1,
        matchesSelectedElement: true,
      });

      expect(validatedLocator.score).toBeGreaterThan(locator.score);
      expect(validatedLocator.reasons).toContain(
        'Appium runtime validation found exactly one element.',
      );
      expect(validatedLocator.reasons).toContain('Runtime result matches the selected element.');

      const failedLocator = applyRuntimeValidationResult(locator, {
        executionTime: 10,
        matchCount: 0,
        matchesSelectedElement: false,
        error: 'invalid selector',
      });

      expect(failedLocator.status).toBe('Invalid');
      expect(failedLocator.warnings).toContain('Runtime validation failed: invalid selector');
    });
  });

  describe('#getLocatorCodeSamples', function () {
    it('should generate AppiumBy display text and Python/Java/JavaScript click samples', function () {
      const locator = {strategy: STRATS.ID, value: 'com.example.app:id/login_button'};

      expect(formatLocatorForAppiumBy(locator)).toBe(
        'AppiumBy.ID("com.example.app:id/login_button")',
      );
      expect(getLocatorCodeSamples(locator)).toEqual({
        python: 'driver.find_element(AppiumBy.ID, "com.example.app:id/login_button").click()',
        java: 'driver.findElement(AppiumBy.id("com.example.app:id/login_button")).click();',
        javascript: 'await driver.$("id=com.example.app:id/login_button").click();',
      });
    });
  });

  describe('#getSmartLocatorRepairSuggestions', function () {
    it('should suggest developer-facing and concrete locator repairs', function () {
      const suggestions = getSmartLocatorRepairSuggestions({
        bestLocator: {
          strategy: STRATS.XPATH,
          value: '/hierarchy/android.widget.FrameLayout/android.widget.TextView',
        },
        selectedElement: {
          attributes: {
            package: 'com.example.app',
            text: 'Login',
            class: 'android.widget.TextView',
          },
        },
      });

      expect(suggestions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            key: 'add-resource-id',
            suggestedValue: 'com.example.app:id/login',
          }),
          expect.objectContaining({
            key: 'add-accessibility-id',
            suggestedValue: 'login',
          }),
          expect.objectContaining({
            key: 'text-class-xpath',
            strategy: STRATS.XPATH,
            value: "//*[@text='Login' and @class='android.widget.TextView']",
          }),
        ]),
      );
    });
  });

  describe('#generatePageObject', function () {
    it('should generate Python, Java, and JavaScript page object skeletons', function () {
      const locator = {strategy: STRATS.ID, value: 'com.example.app:id/login_button'};

      expect(
        generatePageObject({
          locator,
          selectedElement,
          language: 'python',
        }),
      ).toContain('LOGIN_BUTTON = (AppiumBy.ID, "com.example.app:id/login_button")');
      expect(
        generatePageObject({
          locator,
          selectedElement,
          language: 'java',
        }),
      ).toContain('private final By loginButton = AppiumBy.id("com.example.app:id/login_button");');
      expect(
        generatePageObject({
          locator,
          selectedElement,
          language: 'javascript',
        }),
      ).toContain('return this.driver.$("id=com.example.app:id/login_button");');
    });
  });
});
