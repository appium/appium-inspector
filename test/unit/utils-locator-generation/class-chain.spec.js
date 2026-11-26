import {describe, expect, it} from 'vitest';

import {DRIVERS} from '../../../app/common/renderer/constants/common.js';
import {getOptimalClassChain} from '../../../app/common/renderer/utils/locator-generation/class-chain.js';
import {xmlToDOM} from '../../../app/common/renderer/utils/source-parsing.js';

const getClassChainFor = (doc, nodeName, automationName) =>
  getOptimalClassChain(doc, doc.getElementsByTagName(nodeName)[0], automationName);

describe('utils/locator-generation/class-chain.js', function () {
  describe('#getOptimalClassChain', function () {
    it('should use unique class chain attributes if the node has them', function () {
      const doc = xmlToDOM(`<xml>
        <child-node label='hello' text='hello'>Hello</child-node>
        <child-node label='world' text='world'>World</child-node>
      </xml>`);
      expect(getClassChainFor(doc, 'child-node', DRIVERS.XCUITEST)).toBe('/child-node[`label == "hello"`]');
      expect(getClassChainFor(doc, 'child-node', DRIVERS.UIAUTOMATOR2)).toBe('/child-node[`text == "hello"`]');
    });

    it('should use unique class chain attributes of parent if the node does not have them', function () {
      const doc = xmlToDOM(`<root>
        <child name='foo' resource-id='foo'>
          <grandchild>Hello</grandchild>
          <grandchild>World</grandchild>
        </child>
      </root>`);
      expect(getClassChainFor(doc, 'grandchild', DRIVERS.XCUITEST)).toBe('/child[`name == "foo"`]/grandchild[1]');
      expect(getClassChainFor(doc, 'grandchild', DRIVERS.UIAUTOMATOR2)).toBe(
        '/child[`resource-id == "foo"`]/grandchild[1]',
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
      expect(getClassChainFor(doc, 'grandchild', DRIVERS.XCUITEST)).toBe('/root/child[1]/grandchild[1]');
      expect(getClassChainFor(doc, 'grandchild', DRIVERS.UIAUTOMATOR2)).toBe('/root/child[1]/grandchild[1]');
    });
  });
});
