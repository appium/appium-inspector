import {describe, expect, it} from 'vitest';

import {DRIVERS} from '../../../app/common/renderer/constants/common.js';
import {getOptimalClassChain} from '../../../app/common/renderer/utils/locator-generation/class-chain.js';
import {xmlToDOM} from '../../../app/common/renderer/utils/source-parsing.js';

const driverEntries = [
  {
    name: 'XCUITest',
    wrap: (xml) => `<XCUIElementTypeApplication>${xml}</XCUIElementTypeApplication>`,
    getCc: (doc, nodeName) => getOptimalClassChain(doc, doc.getElementsByTagName(nodeName)[0], DRIVERS.XCUITEST),
    labelOrText: 'label',
    nameOrId: 'name',
  },
  {
    name: 'UIAutomator2',
    wrap: (xml) => `<hierarchy>${xml}</hierarchy>`,
    getCc: (doc, nodeName) => getOptimalClassChain(doc, doc.getElementsByTagName(nodeName)[0], DRIVERS.UIAUTOMATOR2),
    labelOrText: 'text',
    nameOrId: 'resource-id',
  },
];

describe('utils/locator-generation/class-chain.js', function () {
  describe('#getOptimalClassChain', function () {
    for (const d of driverEntries) {
      it(`should use unique class chain attributes if the node has them (${d.name})`, function () {
        const doc = xmlToDOM(
          d.wrap(`<node>
            <child class='child' ${d.labelOrText}='hello'>Hello</child>
            <child class='child' ${d.labelOrText}='world'>World</child>
          </node>`),
        );
        expect(d.getCc(doc, 'child')).toBe(`**/child[\`${d.labelOrText} == "hello"\`]`);
      });

      it(`should the node class instead of tag for UiAutomator2`, function ({skip}) {
        skip(d.name !== 'UIAutomator2', 'Only relevant for UiAutomator2 driver');
        const doc = xmlToDOM(
          d.wrap(`<node>
            <child class='child-class' text='hello'>Hello</child>
            <child class='child-class' text='world'>World</child>
          </node>`),
        );
        expect(d.getCc(doc, 'child')).toBe(`**/child-class[\`text == "hello"\`]`);
      });

      it(`should use unique class chain attributes of parent if the node does not have them (${d.name})`, function () {
        const doc = xmlToDOM(
          d.wrap(`<node>
            <child class='child' ${d.nameOrId}='foo'>
              <grandchild class='grandchild'>Hello</grandchild>
              <grandchild class='grandchild'>World</grandchild>
            </child>
          </node>`),
        );
        expect(d.getCc(doc, 'grandchild')).toBe(`**/child[\`${d.nameOrId} == "foo"\`]/grandchild[1]`);
      });

      it(`should build full hierarchy if neither the node nor its ancestors have any unique class chain attributes (${d.name})`, function () {
        const doc = xmlToDOM(
          d.wrap(`<child class='child'>
            <grandchild class='grandchild'>Hello</grandchild>
            <grandchild class='grandchild'>World</grandchild>
          </child>
          <irrelevant-child class='irrelevant-child'></irrelevant-child>
          <child class='child'>
            <grandchild class='grandchild'>Foo</grandchild>
            <grandchild class='grandchild'>Bar</grandchild>
          </child>`),
        );
        expect(d.getCc(doc, 'grandchild')).toBe('child[1]/grandchild[1]');
      });
    }
  });
});
