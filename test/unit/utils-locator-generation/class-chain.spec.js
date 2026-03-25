import {describe, expect, it} from 'vitest';

import {getOptimalClassChain} from '../../../app/common/renderer/utils/locator-generation/class-chain.js';
import {xmlToDOM} from '../../../app/common/renderer/utils/source-parsing.js';

describe('utils/locator-generation/class-chain.js', function () {
  describe('#getOptimalClassChain', function () {
    it('should use unique class chain attributes if the node has them', function () {
      const doc = xmlToDOM(`<xml>
        <child-node label='hello'>Hello</child-node>
        <child-node label='world'>World</child-node>
      </xml>`);
      expect(getOptimalClassChain(doc, doc.getElementsByTagName('child-node')[0])).toBe(
        '/child-node[`label == "hello"`]',
      );
    });

    it('should use unique class chain attributes of parent if the node does not have them', function () {
      const doc = xmlToDOM(`<root>
        <child name='foo'>
          <grandchild>Hello</grandchild>
          <grandchild>World</grandchild>
        </child>
      </root>`);
      expect(getOptimalClassChain(doc, doc.getElementsByTagName('grandchild')[0])).toBe(
        '/child[`name == "foo"`]/grandchild[1]',
      );
    });

    it('should use indices if neither the node nor its ancestors have any unique class chain attributes', function () {
      const doc = xmlToDOM(`<root>
        <child>
          <grandchild>Hello</grandchild>
          <grandchild>World</grandchild>
        </child>
        <irrelevant-child></irrelevant-child>
        <child>
          <grandchild>Foo</grandchild>
          <grandchild>Bar</grandchild>
        </child>
      </root>`);
      expect(getOptimalClassChain(doc, doc.getElementsByTagName('grandchild')[0])).toBe(
        '/root/child[1]/grandchild[1]',
      );
    });
  });
});
