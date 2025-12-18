import {describe, expect, it, vi} from 'vitest';
import xpath from 'xpath';

import {
  areAttrAndValueUnique,
  getOptimalClassChain,
  getOptimalPredicateString,
  getOptimalUiAutomatorSelector,
  getOptimalXPath,
  getSimpleSuggestedLocators,
  isLinkTextUnique,
  isTagUnique,
  isXpathUnique,
} from '../../app/common/renderer/utils/locator-generation.js';
import {xmlToDOM} from '../../app/common/renderer/utils/source-parsing.js';

// Helper that checks that the optimal xpath for a node is the one that we expect and also
// checks that the XPath successfully locates the node in it's doc
function testXPath(doc, node, expectedXPath) {
  expect(getOptimalXPath(doc, node)).toBe(expectedXPath);
  expect(xpath.select(expectedXPath, doc)[0]).toEqual(node);
}

describe('utils/locator-generation.js', function () {
  describe('#isXpathUnique', function () {
    it('should return true if only one element matches the xpath', function () {
      expect(isXpathUnique('//root', xmlToDOM(`<root></root>`))).toBe(true);
    });

    it('should return false if more than one element matches the xpath', function () {
      expect(
        isXpathUnique(
          '//node',
          xmlToDOM(`<root>
          <node></node>
          <node></node>
        </root>`),
        ),
      ).toBe(false);
    });

    it('should return true if no elements match the xpath', function () {
      expect(isXpathUnique('//nonexistent', xmlToDOM(`<root></root>`))).toBe(true);
    });

    it('should return true if no sourceXML was provided', function () {
      expect(isXpathUnique('//tag')).toBe(true);
    });
  });

  describe('#isTagUnique', function () {
    it('should return true if there is only one node with this tag', function () {
      expect(
        isTagUnique(
          'node',
          xmlToDOM(`<root>
          <node></node>
        </root>`),
        ),
      ).toBe(true);
    });

    it('should return false if two nodes have the same tag', function () {
      expect(
        isTagUnique(
          'node',
          xmlToDOM(`<root>
          <node></node>
          <node></node>
        </root>`),
        ),
      ).toBe(false);
    });
  });

  describe('#isLinkTextUnique', function () {
    it('should return true if there is only one node with this link text', function () {
      expect(
        isLinkTextUnique(
          'Link Text',
          xmlToDOM(`<root>
          <a>Link Text</a>
        </root>`),
        ),
      ).toBe(true);
    });

    it('should return false if two nodes have the same link text', function () {
      expect(
        isLinkTextUnique(
          'Link Text',
          xmlToDOM(`<root>
          <a>Link Text</a>
          <a>Link Text</a>
        </root>`),
        ),
      ).toBe(false);
    });
  });

  describe('#areAttrAndValueUnique', function () {
    it('should return true if there is only one node with this attribute value', function () {
      expect(
        areAttrAndValueUnique(
          'id',
          'ID',
          xmlToDOM(`<root>
          <node id='ID'></node>
        </root>`),
        ),
      ).toBe(true);
    });

    it('should return false if two nodes have the same attribute value', function () {
      expect(
        areAttrAndValueUnique(
          'id',
          'ID',
          xmlToDOM(`<root>
          <node id='ID'></node>
          <node id='ID'></node>
        </root>`),
        ),
      ).toBe(false);
    });
  });

  describe('#getSimpleSuggestedLocators', function () {
    describe('native context', function () {
      it('should find ID', function () {
        expect(getSimpleSuggestedLocators({attributes: {'resource-id': 'Resource ID'}}).id).toBe(
          'Resource ID',
        );
        expect(getSimpleSuggestedLocators({attributes: {id: 'ID'}}).id).toBe('ID');
        expect(
          getSimpleSuggestedLocators({attributes: {id: 'ID', 'resource-id': 'Resource ID'}}).id,
        ).toBe('Resource ID');
      });

      it('should not find ID if ID is not unique', function () {
        expect(
          getSimpleSuggestedLocators(
            {attributes: {id: 'ID'}},
            xmlToDOM(`<root>
              <node id='ID'></node>
              <node id='ID'></node>
            </root>`),
          ).id,
        ).toBeUndefined();
      });

      it('should find accessibility id', function () {
        expect(
          getSimpleSuggestedLocators({attributes: {'content-desc': 'Content Desc'}})[
            'accessibility id'
          ],
        ).toBe('Content Desc');
        expect(getSimpleSuggestedLocators({attributes: {name: 'Name'}})['accessibility id']).toBe(
          'Name',
        );
        expect(
          getSimpleSuggestedLocators(
            {attributes: {name: 'Name'}},
            xmlToDOM(`<root>
            <node content-desc='Name'></node>
          </root>`),
          )['accessibility id'],
        ).toBe('Name');
        expect(
          getSimpleSuggestedLocators({attributes: {'content-desc': 'Content Desc', name: 'Name'}})[
            'accessibility id'
          ],
        ).toBe('Content Desc');
      });

      it('should not find accessibility ID if accessibility ID is not unique', function () {
        expect(
          getSimpleSuggestedLocators(
            {attributes: {'content-desc': 'Content Desc'}},
            xmlToDOM(`<root>
              <node content-desc='Content Desc'></node>
              <node content-desc='Content Desc'></node>
            </root>`),
          )['accessibility id'],
        ).toBeUndefined();
      });

      it('should find class name', function () {
        expect(getSimpleSuggestedLocators({attributes: {class: 'The Class'}})['class name']).toBe(
          'The Class',
        );
        expect(getSimpleSuggestedLocators({attributes: {type: 'The Type'}})['class name']).toBe(
          'The Type',
        );
        expect(
          getSimpleSuggestedLocators(
            {attributes: {class: 'The Class'}},
            xmlToDOM(`<root>
            <node type='The Class'></node>
          </root>`),
          )['class name'],
        ).toBe('The Class');
        expect(
          getSimpleSuggestedLocators({attributes: {class: 'The Class', type: 'The Type'}})[
            'class name'
          ],
        ).toBe('The Type');
      });

      it('should not find class name if class name is not unique', function () {
        expect(
          getSimpleSuggestedLocators(
            {attributes: {class: 'The Class'}},
            xmlToDOM(`<root>
              <node class='The Class'></node>
              <node class='The Class'></node>
            </root>`),
          )['class name'],
        ).toBeUndefined();
      });

      it('should not use any non-native context locator strategies', function () {
        expect(
          getSimpleSuggestedLocators({tag: 'tag', attributes: {}})['tag name'],
        ).toBeUndefined();
      });
    });

    describe('non-native context', function () {
      it('should find tag name', function () {
        expect(getSimpleSuggestedLocators({tag: 'tag'}, null, false)['tag name']).toBe('tag');
      });

      it('should not find tag name if it is not unique', function () {
        expect(
          getSimpleSuggestedLocators(
            {tag: 'node'},
            xmlToDOM(`<root>
              <node></node>
              <node></node>
            </root>`),
            false,
          )['tag name'],
        ).toBeUndefined();
      });

      it('should find link text', function () {
        expect(
          getSimpleSuggestedLocators(
            {tag: 'a', text: 'Link Text'},
            xmlToDOM(`<root>
            <a>Link Text</a>
          </root>`),
            false,
          )['link text'],
        ).toBe('Link Text');
      });

      it('should not find link text if it is not unique', function () {
        expect(
          getSimpleSuggestedLocators(
            {tag: 'a', text: 'Link Text'},
            xmlToDOM(`<root>
            <a>Link Text</a>
            <a>Link Text</a>
          </root>`),
            false,
          )['link text'],
        ).toBeUndefined();
      });

      it('should not find link text for non-link elements', function () {
        expect(
          getSimpleSuggestedLocators(
            {tag: 'div', text: 'Link Text'},
            xmlToDOM(`<root>
            <div>Link Text</div>
          </root>`),
            false,
          )['link text'],
        ).toBeUndefined();
      });

      it('should find ID', function () {
        expect(
          getSimpleSuggestedLocators({attributes: {id: 'ID'}}, null, false)['css selector'],
        ).toBe('#ID');
      });

      it('should not find ID if ID is not unique', function () {
        expect(
          getSimpleSuggestedLocators(
            {attributes: {id: 'ID'}},
            xmlToDOM(`<root>
              <node id='ID'></node>
              <node id='ID'></node>
            </root>`),
            false,
          )['css selector'],
        ).toBeUndefined();
      });

      it('should not use any native context locator strategies', function () {
        expect(
          getSimpleSuggestedLocators({attributes: {'resource-id': 'Resource ID'}}, null, false).id,
        ).toBeUndefined();
      });
    });
  });

  describe('#getOptimalXPath', function () {
    describe('on XML with height == 1', function () {
      it('should set an absolute xpath if attrName "id" is set', function () {
        const doc = xmlToDOM(`<node id='foo'></node>`);
        testXPath(doc, doc.getElementById('foo'), '//node[@id="foo"]');
      });

      it('should set an absolute xpath if unique attributes is set to "content-desc" and that attr is set', function () {
        const doc = xmlToDOM(`<node content-desc='foo'></node>`);
        testXPath(doc, doc.firstChild, '//node[@content-desc="foo"]');
      });

      it('should set relative xpath with tagname if no unique attributes are set', function () {
        const doc = xmlToDOM(`<node non-unique-attr='foo'></node>`);
        testXPath(doc, doc.firstChild, '/node');
      });
    });

    describe('on XML with height == 2', function () {
      let doc;

      it('should set first child node to relative xpath with tagname if the child node has no siblings', function () {
        doc = xmlToDOM(`<xml>
          <child-node non-unique-attr='hello'>Hello</child-node>
          <other-node>
            <child-node></child-node>
          </other-node>
        </xml>`);
        testXPath(doc, doc.getElementsByTagName('child-node')[0], '/xml/child-node');
      });

      it('should set first child node to relative xpath with tagname and index', function () {
        doc = xmlToDOM(`<xml>
          <child-node non-unique-attr='hello'>Hello</child-node>
          <child-node non-unique-attr='world'>World</child-node>
        </xml>`);
        testXPath(doc, doc.getElementsByTagName('child-node')[0], '/xml/child-node[1]');
        testXPath(doc, doc.getElementsByTagName('child-node')[1], '/xml/child-node[2]');
      });

      it('should set first child node to absolute xpath if it has ID set', function () {
        doc = xmlToDOM(`<xml>
          <child-node content-desc='hello'>Hello</child-node>
          <child-node content-desc='world'>World</child-node>
        </xml>`);
        testXPath(
          doc,
          doc.getElementsByTagName('child-node')[0],
          '//child-node[@content-desc="hello"]',
        );
        testXPath(
          doc,
          doc.getElementsByTagName('child-node')[1],
          '//child-node[@content-desc="world"]',
        );
      });

      it('should index children based on tagName', function () {
        doc = xmlToDOM(`<xml>
          <child>Hello</child>
          <child-node>World</child-node>
          <child>Foo</child>
          <child-node>Bar</child-node>
        </xml>`);
        testXPath(doc, doc.getElementsByTagName('child')[0], '/xml/child[1]');
        testXPath(doc, doc.getElementsByTagName('child')[1], '/xml/child[2]');
        testXPath(doc, doc.getElementsByTagName('child-node')[0], '/xml/child-node[1]');
        testXPath(doc, doc.getElementsByTagName('child-node')[1], '/xml/child-node[2]');

        doc = xmlToDOM(`<xml>
          <child>Hello</child>
          <child-node>World</child-node>
          <other-child-node>asdfasdf</other-child-node>
          <child-node>Bar</child-node>
        </xml>`);
        testXPath(doc, doc.getElementsByTagName('child')[0], '//child');
        testXPath(doc, doc.getElementsByTagName('child-node')[0], '/xml/child-node[1]');
        testXPath(doc, doc.getElementsByTagName('child-node')[1], '/xml/child-node[2]');
        testXPath(doc, doc.getElementsByTagName('other-child-node')[0], '//other-child-node');
      });
    });

    describe('on XML with height = 3', function () {
      let doc;

      it('should use child as absolute and relative grandchild path if child has an ID set', function () {
        doc = xmlToDOM(`<root>
          <child id='foo'>
            <grandchild>Hello</grandchild>
            <grandchild>World</grandchild>
          </child>
        </root>`);
        testXPath(
          doc,
          doc.getElementsByTagName('grandchild')[0],
          '//child[@id="foo"]/grandchild[1]',
        );
        testXPath(
          doc,
          doc.getElementsByTagName('grandchild')[1],
          '//child[@id="foo"]/grandchild[2]',
        );
      });

      it('should use indices of children and grandchildren if no IDs are set', function () {
        doc = xmlToDOM(`<root>
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
        testXPath(doc, doc.getElementsByTagName('grandchild')[0], '/root/child[1]/grandchild[1]');
        testXPath(doc, doc.getElementsByTagName('grandchild')[1], '/root/child[1]/grandchild[2]');
        testXPath(doc, doc.getElementsByTagName('grandchild')[2], '/root/child[2]/grandchild[1]');
        testXPath(doc, doc.getElementsByTagName('grandchild')[3], '/root/child[2]/grandchild[2]');
      });

      it("should use indices if the unique attribute isn't actually unique", function () {
        doc = xmlToDOM(`<root>
          <child id='foo'>
            <grandchild>Foo</grandchild>
            <grandchild>Bar</grandchild>
          </child>
          <child id='foo'>
            <grandchild>Hello</grandchild>
          </child>
          <child id='foo'></child>
          <another-child>Irrelevant</another-child>
          <another-child>Irrelevant</another-child>
          <child id='foo'>
            <grandchild></grandchild>
            <child id='foo'>
              <great-grand-child></great-grand-child>
            </child>
          </child>
        </root>`);
        const grandchildren = doc.getElementsByTagName('grandchild');
        testXPath(doc, grandchildren[0], '(//child[@id="foo"])[1]/grandchild[1]');
        testXPath(doc, grandchildren[1], '(//child[@id="foo"])[1]/grandchild[2]');
        testXPath(doc, grandchildren[2], '(//child[@id="foo"])[2]/grandchild');
        testXPath(doc, grandchildren[3], '(//child[@id="foo"])[4]/grandchild');

        const greatgrandchildren = doc.getElementsByTagName('great-grand-child');
        testXPath(doc, greatgrandchildren[0], '//great-grand-child');

        const children = doc.getElementsByTagName('child');
        testXPath(doc, children[0], '(//child[@id="foo"])[1]');
        testXPath(doc, children[1], '(//child[@id="foo"])[2]');
        testXPath(doc, children[2], '(//child[@id="foo"])[3]');
        testXPath(doc, children[3], '(//child[@id="foo"])[4]');
        testXPath(doc, children[4], '(//child[@id="foo"])[5]');
      });

      it('should return conjunctively unique xpath locators if they exist', function () {
        doc = xmlToDOM(`<root>
          <child id='foo' text='bar'></child>
          <child text='yo'></child>
          <child id='foo' text='yo'></child>
          <child id='foo'></child>
          <child text='zoom'></child>
          <child id='bar' text='ohai'></child>
          <child id='bar' text='ohai'></child>
        </root>`);
        const children = doc.getElementsByTagName('child');
        testXPath(doc, children[0], '//child[@id="foo" and @text="bar"]');
        testXPath(doc, children[1], '(//child[@text="yo"])[1]');
        testXPath(doc, children[2], '//child[@id="foo" and @text="yo"]');
        testXPath(doc, children[3], '(//child[@id="foo"])[3]');
        testXPath(doc, children[4], '//child[@text="zoom"]');
        testXPath(doc, children[5], '(//child[@id="bar"])[1]');
        testXPath(doc, children[6], '(//child[@id="bar"])[2]');
      });
    });

    describe('when exceptions are thrown', function () {
      it('should keep going if xpath.select throws an exception', function () {
        vi.spyOn(xpath, 'select').mockImplementation(() => {
          throw new Error('Exception');
        });
        const doc = xmlToDOM(`<node id='foo'>
          <child id='a'></child>
          <child id='b'>
            <grandchild id='hello'></grandchild>
          </child>
        </node>`);
        expect(getOptimalXPath(doc, doc.getElementById('hello'))).toBe('/node/child[2]/grandchild');
      });

      it('should return null if anything else throws an exception', function () {
        const doc = xmlToDOM(`<node id='foo'>
          <child id='a'></child>
          <child id='b'>
            <grandchild id='hello'></grandchild>
          </child>
        </node>`);
        const node = doc.getElementById('hello');
        node.getAttribute = () => {
          throw new Error('Some unexpected error');
        };
        expect(getOptimalXPath(doc, node)).toBeNull();
      });
    });
  });

  describe('#getOptimalClassChain', function () {
    let doc;

    it('should use unique class chain attributes if the node has them', function () {
      doc = xmlToDOM(`<xml>
        <child-node label='hello'>Hello</child-node>
        <child-node label='world'>World</child-node>
      </xml>`);
      expect(getOptimalClassChain(doc, doc.getElementsByTagName('child-node')[0])).toBe(
        '/child-node[`label == "hello"`]',
      );
    });

    it('should use unique class chain attributes of parent if the node does not have them', function () {
      doc = xmlToDOM(`<root>
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
      doc = xmlToDOM(`<root>
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

  describe('#getOptimalPredicateString', function () {
    let doc;

    it('should exist if the node has unique predicate string attributes', function () {
      doc = xmlToDOM(`<xml>
        <child-node label='hello'>Hello</child-node>
        <child-node label='world'>World</child-node>
      </xml>`);
      expect(getOptimalPredicateString(doc, doc.getElementsByTagName('child-node')[0])).toBe(
        'label == "hello"',
      );
    });

    it('should not exist if the node does not have unique predicate string attributes', function () {
      doc = xmlToDOM(`<root>
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

  describe('#getOptimalUiAutomatorSelector', function () {
    let doc;

    it('should use unique UiAutomator attributes if the node has them', function () {
      doc = xmlToDOM(`<xml>
        <parent-node>
          <child-node resource-id='hello'>Hello</child-node>
          <child-node resource-id='world'>World</child-node>
        </parent-node>
      </xml>`);
      expect(
        getOptimalUiAutomatorSelector(doc, doc.getElementsByTagName('child-node')[0], '0.0'),
      ).toBe('new UiSelector().resourceId("hello")');
    });

    it('should use indices if the valid node attributes are not unique', function () {
      doc = xmlToDOM(`<root>
        <child>
          <grandchild class='grandchild'>Hello</grandchild>
          <grandchild class='grandchild'>World</grandchild>
        </child>
      </root>`);
      expect(
        getOptimalUiAutomatorSelector(doc, doc.getElementsByTagName('grandchild')[0], '0.0'),
      ).toBe('new UiSelector().className("grandchild").instance(0)');
    });

    it('should return null if looking for element outside the last direct child of the hierarchy', function () {
      doc = xmlToDOM(`<root>
        <child>
          <grandchild resource-id='hello'>Hello</grandchild>
          <grandchild resource-id='world'>World</grandchild>
        </child>
        <child>
          <grandchild resource-id='foo'>Foo</grandchild>
          <grandchild resource-id='bar'>Bar</grandchild>
        </child>
      </root>`);
      expect(
        getOptimalUiAutomatorSelector(doc, doc.getElementsByTagName('grandchild')[0], '0.0'),
      ).toBeNull();
    });
  });
});
