import {describe, expect, it} from 'vitest';

import {DRIVERS} from '../../../../app/common/renderer/constants/common.js';
import {getOptimalPredicateString} from '../../../../app/common/renderer/utils/locator-generation/predicate.js';
import {xmlToDOM} from '../../../../app/common/renderer/utils/source-parsing.js';

const driverEntries = [
  {
    name: 'XCUITest',
    getPredicate: (doc, nodeName) =>
      getOptimalPredicateString(doc, doc.getElementsByTagName(nodeName)[0], DRIVERS.XCUITEST),
    labelOrText: 'label',
  },
  {
    name: 'UIAutomator2',
    getPredicate: (doc, nodeName) =>
      getOptimalPredicateString(doc, doc.getElementsByTagName(nodeName)[0], DRIVERS.UIAUTOMATOR2),
    labelOrText: 'text',
  },
];

describe('utils/locator-generation/predicate.js', function () {
  describe('#getOptimalPredicateString', function () {
    for (const d of driverEntries) {
      it(`should exist if the node has unique predicate string attributes (${d.name})`, function () {
        const doc = xmlToDOM(`<xml>
          <child-node ${d.labelOrText}='hello'>Hello</child-node>
          <child-node ${d.labelOrText}='world'>World</child-node>
        </xml>`);
        expect(d.getPredicate(doc, 'child-node')).toBe(`${d.labelOrText} == "hello"`);
      });

      it(`should not exist if the node does not have unique predicate string attributes (${d.name})`, function () {
        const doc = xmlToDOM(`<root>
          <child>
            <grandchild>Hello</grandchild>
            <grandchild>World</grandchild>
          </child>
        </root>`);
        expect(d.getPredicate(doc, 'grandchild')).toBeUndefined();
      });
    }
  });
});
