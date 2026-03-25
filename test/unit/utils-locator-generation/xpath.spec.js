import {describe, expect, it, vi} from 'vitest';
import * as xpath from 'xpath';

import {getOptimalXPath} from '../../../app/common/renderer/utils/locator-generation/xpath.js';
import {xmlToDOM} from '../../../app/common/renderer/utils/source-parsing.js';

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

describe('utils/locator-generation/xpath.js', function () {
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
      it('should use tagname if the node has a unique tag with no attributes', function () {
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

        it('should use parent tagname if only the node has attributes but they are not unique', function () {
          const doc = xmlToDOM(`<root>
            <parent>
              <node id='foo'></node>
              <node id='foo'></node>
            </parent>
          </root>`);
          testXPath(doc, doc.getElementsByTagName('node')[0], '//parent/node[1]');
        });

        it('should use parent attributes if node attributes are not unique', function () {
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

        it('should use indices if only node has unique attributes', function () {
          const doc = xmlToDOM(`<root>
            <parent>
              <node id='bar'>Hello</node>
            </parent>
            <parent>
              <node id='bar'>World</node>
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
});
