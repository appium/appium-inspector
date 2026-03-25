import {describe, expect, it, vi} from 'vitest';
import * as xpath from 'xpath';

import {getOptimalClassChain} from '../../app/common/renderer/utils/locator-generation/class-chain.js';
import {getOptimalPredicateString} from '../../app/common/renderer/utils/locator-generation/predicate.js';
import {
  areAttrAndValueUnique,
  getSimpleSuggestedLocators,
  isTagUnique,
} from '../../app/common/renderer/utils/locator-generation/simple.js';
import {getOptimalUiAutomatorSelector} from '../../app/common/renderer/utils/locator-generation/uiautomator.js';
import {getOptimalXPath} from '../../app/common/renderer/utils/locator-generation/xpath.js';
import {xmlToDOM} from '../../app/common/renderer/utils/source-parsing.js';

// Create identical mock of xpath, so that xpath.select can be modified as needed
vi.mock('xpath', async (importOriginal) => {
  const originalXpath = await importOriginal();
  return {
    ...originalXpath,
    select: vi.fn(originalXpath.select),
  };
});

// Helper that checks that the optimal xpath for a node is the one that we expect and also
// checks that the XPath successfully locates the node in its doc
function testXPath(doc, node, expectedXPath) {
  expect(getOptimalXPath(doc, node)).toBe(expectedXPath);
  expect(xpath.select(expectedXPath, doc)[0]).toEqual(node);
}

describe('utils/locator-generation.js', function () {
  describe('#isTagUnique', function () {
    it('should return true if there is exactly one node with this tag', function () {
      expect(isTagUnique('root', xmlToDOM(`<root></root>`))).toBe(true);
    });

    it('should return false if there are zero or multiple nodes with this tag', function () {
      expect(isTagUnique('node', xmlToDOM(`<root></root>`))).toBe(false);
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

    it('should return false if the tag name is empty or absent', function () {
      expect(isTagUnique(null, xmlToDOM(`<root></root>`))).toBe(false);
      expect(isTagUnique('', xmlToDOM(`<root></root>`))).toBe(false);
    });

    it('should apply whitespace normalization', function () {
      // whitespaces inside the XML tag are caught by xmldom as invalid tag name
      expect(isTagUnique('root   ', xmlToDOM(`<root></root>`))).toBe(true);
    });

    // Full tag name specification: https://www.w3.org/TR/REC-xml/#d0e804
    // Note: @xmldom/xmldom does not fully comply with this spec (https://github.com/xmldom/xmldom/issues/252)
    it('should handle valid tag names with special characters', function () {
      expect(isTagUnique('_-.234·', xmlToDOM(`<_-.234·></_-.234·>`))).toBe(true);
    });
  });

  describe('#areAttrAndValueUnique', function () {
    it('should return true if there is exactly one node with this attribute name and value', function () {
      expect(areAttrAndValueUnique('id', 'ID', xmlToDOM(`<node id='ID'></node>`))).toBe(true);
    });

    it('should return false if there are zero or multiple nodes with this attribute name and value', function () {
      expect(areAttrAndValueUnique('id2', 'ID', xmlToDOM(`<node id='ID'></node>`))).toBe(false);
      expect(areAttrAndValueUnique('id', 'ID2', xmlToDOM(`<node id='ID'></node>`))).toBe(false);
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

    it('should return false if the attribute name or value is empty or absent', function () {
      expect(areAttrAndValueUnique('id', null, xmlToDOM(`<node id='ID'></node>`))).toBe(false);
      expect(areAttrAndValueUnique(null, 'ID', xmlToDOM(`<node id='ID'></node>`))).toBe(false);
      expect(areAttrAndValueUnique('', '', xmlToDOM(`<node id='ID'></node>`))).toBe(false);
    });

    it('should only apply whitespace normalization to the attribute name', function () {
      expect(areAttrAndValueUnique(' id   ', 'ID', xmlToDOM(`<node id='ID'></node>`))).toBe(true);
      expect(areAttrAndValueUnique('id', '  ID', xmlToDOM(`<node id='ID  '></node>`))).toBe(false);
    });

    // Attribute name specification is a superset of the tag name spec:
    // https://www.w3.org/TR/REC-xml/#sec-attribute-types
    it('should handle valid attribute names and values with special characters', function () {
      expect(areAttrAndValueUnique('_-.234·', 'ID', xmlToDOM(`<node _-.234·='ID'></node>`))).toBe(
        true,
      );
      expect(
        areAttrAndValueUnique(
          'id',
          `!@£$#%^&*(-_=/\\.>°§"`,
          xmlToDOM(`<node id='!@£$#%^&*(-_=/\\.>°§"'></node>`),
        ),
      ).toBe(true);
      expect(
        areAttrAndValueUnique(
          'id',
          `!@£$#%^&*(-_=/\\.>°§'`,
          xmlToDOM(`<node id="!@£$#%^&*(-_=/\\.>°§'"></node>`),
        ),
      ).toBe(true);
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
            {attributes: {'content-desc': 'Name'}},
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
            {attributes: {type: 'The Class'}},
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

      it('should find and escape unique ID with special characters', function () {
        expect(
          getSimpleSuggestedLocators({attributes: {id: '!@£$#%^&*(-_=/\\.>°§"'}}, null, false)[
            'css selector'
          ],
        ).toBe('#\\!\\@£\\$\\#\\%\\^\\&\\*\\(-_\\=\\/\\\\\\.\\>°§\\"');
      });

      it('should not use any native context locator strategies', function () {
        expect(
          getSimpleSuggestedLocators({attributes: {'resource-id': 'Resource ID'}}, null, false).id,
        ).toBeUndefined();
      });
    });
  });

  describe('#getOptimalXPath', function () {
    describe('using only the node itself', function () {
      it('should use a relative xpath if the node has no attributes', function () {
        const doc = xmlToDOM(`<root></root>`);
        testXPath(doc, doc.firstChild, '/root');
      });

      it('should use an absolute xpath if the node has a unique attribute', function () {
        const doc = xmlToDOM(`<root id='foo'></root>`);
        testXPath(doc, doc.firstChild, '//root[@id="foo"]');
      });

      it('should use an absolute xpath if the node has a maybe-unique attribute', function () {
        const doc = xmlToDOM(`<root text='foo'></root>`);
        testXPath(doc, doc.firstChild, '//root[@text="foo"]');
      });

      it('should prefer unique attributes over maybe-unique ones', function () {
        const doc = xmlToDOM(`<root text='foo' name='bar'></root>`);
        testXPath(doc, doc.firstChild, '//root[@name="bar"]');
      });

      it('should use a relative xpath if the node has no unique or maybe-unique attributes', function () {
        const doc = xmlToDOM(`<root non-unique-attr='foo'></root>`);
        testXPath(doc, doc.firstChild, '/root');
      });
    });

    describe('using the node and its siblings', function () {
      it('should use tagname if the node has a unique tag and no attributes', function () {
        const doc = xmlToDOM(`<root>
          <node></node>
          <other-node></other-node>
        </root>`);
        testXPath(doc, doc.getElementsByTagName('node')[0], '//node');
      });

      it('should use a unique attribute if the node has one', function () {
        const doc = xmlToDOM(`<root>
          <node id='foo'></node>
          <node id='bar'></node>
        </root>`);
        testXPath(doc, doc.getElementsByTagName('node')[0], '//node[@id="foo"]');
      });

      it('should combine unique and maybe-unique attributes if only the maybe-unique attribute differs', function () {
        const doc = xmlToDOM(`<root>
          <node id='foo' text='bar'></node>
          <node id='foo' text='yo'></node>
        </root>`);
        const children = doc.getElementsByTagName('node');
        testXPath(doc, children[0], '//node[@id="foo" and @text="bar"]');
        testXPath(doc, children[1], '//node[@id="foo" and @text="yo"]');
      });
    });

    describe('using the node and its parent and siblings', function () {
      describe('identical nodes in one parent', function () {
        it('should use parent tagname if there are no unique attributes', function () {
          const doc = xmlToDOM(`<root>
            <parent>
              <node>Hello</node>
              <node>World</node>
            </parent>
          </root>`);
          testXPath(doc, doc.getElementsByTagName('node')[0], '//parent/node[1]');
          testXPath(doc, doc.getElementsByTagName('node')[1], '//parent/node[2]');
        });

        it('should use parent attributes if only the parent has them', function () {
          const doc = xmlToDOM(`<root>
            <parent id='foo'>
              <node>Hello</node>
              <node>World</node>
            </parent>
          </root>`);
          testXPath(doc, doc.getElementsByTagName('node')[0], '//parent[@id="foo"]/node[1]');
          testXPath(doc, doc.getElementsByTagName('node')[1], '//parent[@id="foo"]/node[2]');
        });

        it('should use parent attributes even if the node also has them', function () {
          const doc = xmlToDOM(`<root>
            <parent id='foo'>
              <node id='bar'>Hello</node>
              <node id='bar'>World</node>
            </parent>
          </root>`);
          testXPath(doc, doc.getElementsByTagName('node')[0], '//parent[@id="foo"]/node[1]');
          testXPath(doc, doc.getElementsByTagName('node')[1], '//parent[@id="foo"]/node[2]');
        });

        it('should use different indices for nodes with different tag names', function () {
          const doc = xmlToDOM(`<root>
            <parent>
              <node>Hello</node>
              <other-node>World</other-node>
              <node>Foo</node>
              <another-node>Bar</another-node>
              <other-node>Baz</other-node>
            </parent>
          </root>`);
          testXPath(doc, doc.getElementsByTagName('node')[0], '//parent/node[1]');
          testXPath(doc, doc.getElementsByTagName('node')[1], '//parent/node[2]');
          testXPath(doc, doc.getElementsByTagName('other-node')[0], '//parent/other-node[1]');
          testXPath(doc, doc.getElementsByTagName('other-node')[1], '//parent/other-node[2]');
          testXPath(doc, doc.getElementsByTagName('another-node')[0], '//another-node');
        });
      });

      describe('identical nodes in multiple different parents', function () {
        it('should use parent tagnames if there are no other unique attributes', function () {
          const doc = xmlToDOM(`<root>
            <parent>
              <node>Hello</node>
            </parent>
            <other-parent>
              <node>Hello</node>
            </other-parent>
            <another-parent>
              <node>Hello</node>
            </another-parent>
          </root>`);
          testXPath(doc, doc.getElementsByTagName('node')[0], '//parent/node');
          testXPath(doc, doc.getElementsByTagName('node')[1], '//other-parent/node');
          testXPath(doc, doc.getElementsByTagName('node')[2], '//another-parent/node');
        });

        it('should use parent attributes if only the parent has them', function () {
          const doc = xmlToDOM(`<root>
            <parent id='foo'>
              <node>Hello</node>
            </parent>
            <parent id='baz'>
              <node>Hello</node>
            </parent>
            <parent id='quux'>
              <node>Hello</node>
            </parent>
          </root>`);
          testXPath(doc, doc.getElementsByTagName('node')[0], '//parent[@id="foo"]/node');
          testXPath(doc, doc.getElementsByTagName('node')[1], '//parent[@id="baz"]/node');
          testXPath(doc, doc.getElementsByTagName('node')[2], '//parent[@id="quux"]/node');
        });

        it('should use parent attributes even if the node also has them', function () {
          const doc = xmlToDOM(`<root>
            <parent id='foo'>
              <node id='bar'>Hello</node>
            </parent>
            <parent id='baz'>
              <node id='bar'>Hello</node>
            </parent>
            <parent id='quux'>
              <node id='bar'>Hello</node>
            </parent>
          </root>`);
          testXPath(doc, doc.getElementsByTagName('node')[0], '//parent[@id="foo"]/node');
          testXPath(doc, doc.getElementsByTagName('node')[1], '//parent[@id="baz"]/node');
          testXPath(doc, doc.getElementsByTagName('node')[2], '//parent[@id="quux"]/node');
        });

        it('should use parent and node attributes if the node has siblings with the same tag but different attributes', function () {
          const doc = xmlToDOM(`<root>
            <parent id='foo'>
              <node id='quux'>Hello</node>
              <node id='bar'>Hello</node>
            </parent>
            <parent id='baz'>
              <node id='quux'>World</node>
              <node id='bar'>World</node>
            </parent>
          </root>`);
          testXPath(
            doc,
            doc.getElementsByTagName('node')[0],
            '//parent[@id="foo"]/node[@id="quux"]',
          );
          testXPath(
            doc,
            doc.getElementsByTagName('node')[1],
            '//parent[@id="foo"]/node[@id="bar"]',
          );
          testXPath(
            doc,
            doc.getElementsByTagName('node')[2],
            '//parent[@id="baz"]/node[@id="quux"]',
          );
          testXPath(
            doc,
            doc.getElementsByTagName('node')[3],
            '//parent[@id="baz"]/node[@id="bar"]',
          );
        });
      });

      describe('identical nodes in multiple identical parents', function () {
        it('should use indices if there are no unique attributes', function () {
          const doc = xmlToDOM(`<root>
            <parent>
              <node>Hello</node>
              <node>World</node>
            </parent>
            <another-parent></another-parent>
            <parent>
              <node>Foo</node>
              <node>Bar</node>
            </parent>
          </root>`);
          testXPath(doc, doc.getElementsByTagName('node')[0], '/root/parent[1]/node[1]');
          testXPath(doc, doc.getElementsByTagName('node')[1], '/root/parent[1]/node[2]');
          testXPath(doc, doc.getElementsByTagName('node')[2], '/root/parent[2]/node[1]');
          testXPath(doc, doc.getElementsByTagName('node')[3], '/root/parent[2]/node[2]');
        });

        it('should use indices if only parent has unique attributes', function () {
          const doc = xmlToDOM(`<root>
            <parent id='foo'>
              <node>Hello</node>
            </parent>
            <parent id='foo'>
              <node>World</node>
            </parent>
          </root>`);
          testXPath(doc, doc.getElementsByTagName('node')[0], '/root/parent[1]/node');
          testXPath(doc, doc.getElementsByTagName('node')[1], '/root/parent[2]/node');
        });

        it('should use indices if both parent and node have unique attributes', function () {
          const doc = xmlToDOM(`<root>
            <parent id='foo'>
              <node id='bar'>Hello</node>
            </parent>
            <parent id='foo'>
              <node id='bar'>World</node>
            </parent>
          </root>`);
          testXPath(doc, doc.getElementsByTagName('node')[0], '/root/parent[1]/node');
          testXPath(doc, doc.getElementsByTagName('node')[1], '/root/parent[2]/node');
        });

        it('should use indices if the node has identical siblings', function () {
          const doc = xmlToDOM(`<root>
            <parent id='foo'>
              <node id='bar'>Hello</node>
              <node id='bar'>Hello</node>
            </parent>
            <parent id='foo'>
              <node id='bar'>World</node>
              <node id='bar'>World</node>
            </parent>
          </root>`);
          testXPath(doc, doc.getElementsByTagName('node')[0], '/root/parent[1]/node[1]');
          testXPath(doc, doc.getElementsByTagName('node')[1], '/root/parent[1]/node[2]');
          testXPath(doc, doc.getElementsByTagName('node')[2], '/root/parent[2]/node[1]');
          testXPath(doc, doc.getElementsByTagName('node')[3], '/root/parent[2]/node[2]');
        });

        it('should use indices and node attributes if the node has siblings with the same tag but different attributes', function () {
          const doc = xmlToDOM(`<root>
            <parent id='foo'>
              <node id='bar'>Hello</node>
              <node id='baz'>World</node>
            </parent>
            <parent id='foo'>
              <node id='bar'>Hello</node>
              <node id='baz'>World</node>
            </parent>
          </root>`);
          testXPath(doc, doc.getElementsByTagName('node')[0], '/root/parent[1]/node[@id="bar"]');
          testXPath(doc, doc.getElementsByTagName('node')[1], '/root/parent[1]/node[@id="baz"]');
          testXPath(doc, doc.getElementsByTagName('node')[2], '/root/parent[2]/node[@id="bar"]');
          testXPath(doc, doc.getElementsByTagName('node')[3], '/root/parent[2]/node[@id="baz"]');
        });
      });

      describe('identical nodes in different levels', function () {
        it('should use parent attributes if the node has no siblings nor attributes', function () {
          const doc = xmlToDOM(`<root>
            <node>Hello</node>
            <node>World</node>
            <parent id='foo'>
              <node>Hello</node>
            </parent>
          </root>`);
          testXPath(doc, doc.getElementsByTagName('node')[2], '//parent[@id="foo"]/node');
        });

        it('should use parent attributes if the node has no siblings but has attributes', function () {
          const doc = xmlToDOM(`<root>
            <node id='bar'>Hello</node>
            <node id='bar'>World</node>
            <parent id='foo'>
              <node id='bar'>Hello</node>
            </parent>
          </root>`);
          testXPath(doc, doc.getElementsByTagName('node')[2], '//parent[@id="foo"]/node');
        });

        it('should use parent attributes and node index if the node has identical siblings', function () {
          const doc = xmlToDOM(`<root>
            <node id='bar'>Hello</node>
            <node id='bar'>World</node>
            <parent id='foo'>
              <node id='bar'>Hello</node>
              <node id='bar'>World</node>
            </parent>
          </root>`);
          testXPath(doc, doc.getElementsByTagName('node')[2], '//parent[@id="foo"]/node[1]');
        });

        it('should use parent and node attributes if the node has siblings with the same tag but different attributes', function () {
          const doc = xmlToDOM(`<root>
            <node id='bar'>Hello</node>
            <node id='baz'>World</node>
            <parent id='foo'>
              <node id='bar'>Hello</node>
              <node id='baz'>World</node>
            </parent>
          </root>`);
          testXPath(
            doc,
            doc.getElementsByTagName('node')[2],
            '//parent[@id="foo"]/node[@id="bar"]',
          );
          testXPath(
            doc,
            doc.getElementsByTagName('node')[3],
            '//parent[@id="foo"]/node[@id="baz"]',
          );
        });
      });
    });

    describe('when exceptions are thrown', function () {
      it('should keep going if xpath.select throws an exception', function () {
        vi.mocked(xpath.select).mockImplementation(() => {
          throw new Error('Exception');
        });
        const doc = xmlToDOM(`<root id='foo'>
          <parent id='a'></parent>
          <parent id='b'>
            <node id='hello'></node>
          </parent>
        </root>`);
        expect(getOptimalXPath(doc, doc.getElementById('hello'))).toBe('/root/parent[2]/node');
      });

      it('should return null if anything else throws an exception', function () {
        const doc = xmlToDOM(`<root id='foo'>
          <parent id='a'></parent>
          <parent id='b'>
            <node id='hello'></node>
          </parent>
        </root>`);
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
