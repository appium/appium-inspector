import {describe, expect, it} from 'vitest';

import {DRIVERS} from '../../../app/common/renderer/constants/common.js';
import {getOptimalPredicateString} from '../../../app/common/renderer/utils/locator-generation/predicate.js';
import {xmlToDOM} from '../../../app/common/renderer/utils/source-parsing.js';

const getPredicateFor = (doc, nodeName, automationName) =>
  getOptimalPredicateString(doc, doc.getElementsByTagName(nodeName)[0], automationName);

describe('utils/locator-generation/predicate.js', function () {
  describe('#getOptimalPredicateString', function () {
    it('should exist if the node has unique predicate string attributes', function () {
      const doc = xmlToDOM(`<xml>
        <child-node label='hello' text='hello'>Hello</child-node>
        <child-node label='world' text='world'>World</child-node>
      </xml>`);
      expect(getPredicateFor(doc, 'child-node', DRIVERS.XCUITEST)).toBe('label == "hello"');
      expect(getPredicateFor(doc, 'child-node', DRIVERS.UIAUTOMATOR2)).toBe('text == "hello"');
    });

    it('should not exist if the node does not have unique predicate string attributes', function () {
      const doc = xmlToDOM(`<root>
        <child name='foo' resource-id='foo'>
          <grandchild>Hello</grandchild>
          <grandchild>World</grandchild>
        </child>
      </root>`);
      expect(getPredicateFor(doc, 'grandchild', DRIVERS.XCUITEST)).toBeUndefined();
      expect(getPredicateFor(doc, 'grandchild', DRIVERS.UIAUTOMATOR2)).toBeUndefined();
    });
  });
});
