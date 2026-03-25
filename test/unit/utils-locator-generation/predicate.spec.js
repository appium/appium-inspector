import {describe, expect, it} from 'vitest';

import {getOptimalPredicateString} from '../../../app/common/renderer/utils/locator-generation/predicate.js';
import {xmlToDOM} from '../../../app/common/renderer/utils/source-parsing.js';

describe('utils/locator-generation/predicate.js', function () {
  describe('#getOptimalPredicateString', function () {
    it('should exist if the node has unique predicate string attributes', function () {
      const doc = xmlToDOM(`<xml>
        <child-node label='hello'>Hello</child-node>
        <child-node label='world'>World</child-node>
      </xml>`);
      expect(getOptimalPredicateString(doc, doc.getElementsByTagName('child-node')[0])).toBe(
        'label == "hello"',
      );
    });

    it('should not exist if the node does not have unique predicate string attributes', function () {
      const doc = xmlToDOM(`<root>
        <child name='foo'>
          <grandchild>Hello</grandchild>
          <grandchild>World</grandchild>
        </child>
      </root>`);
      expect(
        getOptimalPredicateString(doc, doc.getElementsByTagName('grandchild')[0]),
      ).toBeUndefined();
    });
  });
});
