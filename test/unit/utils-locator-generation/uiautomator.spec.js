import {describe, expect, it} from 'vitest';

import {getOptimalUiAutomatorSelector} from '../../../app/common/renderer/utils/locator-generation/uiautomator.js';
import {xmlToDOM} from '../../../app/common/renderer/utils/source-parsing.js';

describe('utils/locator-generation/uiautomator.js', function () {
  describe('#getOptimalUiAutomatorSelector', function () {
    it('should use unique UiAutomator attributes if the node has them', function () {
      const doc = xmlToDOM(`<xml>
        <parent-node>
          <child-node resource-id='hello'>Hello</child-node>
          <child-node resource-id='world'>World</child-node>
        </parent-node>
      </xml>`);
      expect(getOptimalUiAutomatorSelector(doc, doc.getElementsByTagName('child-node')[0], '0.0')).toBe(
        'new UiSelector().resourceId("hello")',
      );
    });

    it('should use indices if the valid node attributes are not unique', function () {
      const doc = xmlToDOM(`<root>
        <child>
          <grandchild class='grandchild'>Hello</grandchild>
          <grandchild class='grandchild'>World</grandchild>
        </child>
      </root>`);
      expect(getOptimalUiAutomatorSelector(doc, doc.getElementsByTagName('grandchild')[0], '0.0')).toBe(
        'new UiSelector().className("grandchild").instance(0)',
      );
    });

    it('should not treat attributes as unique if nodes with other tag names share them', function () {
      const doc = xmlToDOM(`<root>
        <child>
          <button-node text='OK'>Button</button-node>
          <text-node text='OK' content-desc='label'>Text</text-node>
        </child>
      </root>`);
      expect(getOptimalUiAutomatorSelector(doc, doc.getElementsByTagName('text-node')[0], '0.1')).toBe(
        'new UiSelector().description("label")',
      );
    });

    it('should count nodes with other tag names when calculating the instance index', function () {
      const doc = xmlToDOM(`<root>
        <child>
          <linear-layout resource-id='content'>Linear</linear-layout>
          <relative-layout resource-id='content'>First</relative-layout>
          <relative-layout resource-id='content'>Second</relative-layout>
        </child>
      </root>`);
      expect(getOptimalUiAutomatorSelector(doc, doc.getElementsByTagName('relative-layout')[1], '0.2')).toBe(
        'new UiSelector().resourceId("content").instance(2)',
      );
    });

    it('should return null if looking for element outside the last direct child of the hierarchy', function () {
      const doc = xmlToDOM(`<root>
        <child>
          <grandchild resource-id='hello'>Hello</grandchild>
          <grandchild resource-id='world'>World</grandchild>
        </child>
        <child>
          <grandchild resource-id='foo'>Foo</grandchild>
          <grandchild resource-id='bar'>Bar</grandchild>
        </child>
      </root>`);
      expect(getOptimalUiAutomatorSelector(doc, doc.getElementsByTagName('grandchild')[0], '0.0')).toBeNull();
    });
  });
});
