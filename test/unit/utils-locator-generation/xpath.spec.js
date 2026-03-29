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

    // Tests in this block do not check identical nodes, as their presence would require using their parent,
    // which is tested in the next block
    describe('using the node and other non-identical siblings', function () {
      it('should only use tagname if there are no attributes', function () {
        const doc = xmlToDOM(`<root>
          <node></node>
          <other-node></other-node>
        </root>`);
        testXPath(doc, doc.getElementsByTagName('node')[0], '//node');
        testXPath(doc, doc.getElementsByTagName('other-node')[0], '//other-node');
      });

      it('should use a unique attribute if one exists', function () {
        const doc = xmlToDOM(`<root>
          <node id='foo'></node>
          <node id='bar'></node>
        </root>`);
        const nodes = doc.getElementsByTagName('node');
        testXPath(doc, nodes[0], '//node[@id="foo"]');
        testXPath(doc, nodes[1], '//node[@id="bar"]');
      });

      it('should combine unique and maybe-unique attributes if only the maybe-unique attribute differs', function () {
        const doc = xmlToDOM(`<root>
          <node id='foo' text='bar'></node>
          <node id='foo' text='yo'></node>
        </root>`);
        const nodes = doc.getElementsByTagName('node');
        testXPath(doc, nodes[0], '//node[@id="foo" and @text="bar"]');
        testXPath(doc, nodes[1], '//node[@id="foo" and @text="yo"]');
      });
    });

    describe('using identical nodes and their shared parent', function () {
      it('should use parent tagname if the node has no unique attributes', function () {
        const doc = xmlToDOM(`<root>
          <parent>
            <node></node>
            <node></node>
          </parent>
        </root>`);
        const nodes = doc.getElementsByTagName('node');
        testXPath(doc, nodes[0], '//parent/node[1]');
        testXPath(doc, nodes[1], '//parent/node[2]');
      });

      it('should use parent attributes if only the parent has them', function () {
        const doc = xmlToDOM(`<root>
          <parent id='foo'>
            <node></node>
            <node></node>
          </parent>
        </root>`);
        const nodes = doc.getElementsByTagName('node');
        testXPath(doc, nodes[0], '//parent[@id="foo"]/node[1]');
        testXPath(doc, nodes[1], '//parent[@id="foo"]/node[2]');
      });

      it('should use parent tagname and node attributes if only the node has attributes', function () {
        const doc = xmlToDOM(`<root>
          <parent>
            <node id='foo'></node>
            <node id='foo'></node>
          </parent>
        </root>`);
        const nodes = doc.getElementsByTagName('node');
        testXPath(doc, nodes[0], '(//parent/node[@id="foo"])[1]');
        testXPath(doc, nodes[1], '(//parent/node[@id="foo"])[2]');
      });

      it('should use parent and node attributes if both have them', function () {
        const doc = xmlToDOM(`<root>
          <parent id='foo'>
            <node id='bar'></node>
            <node id='bar'></node>
          </parent>
        </root>`);
        const nodes = doc.getElementsByTagName('node');
        testXPath(doc, nodes[0], '(//parent[@id="foo"]/node[@id="bar"])[1]');
        testXPath(doc, nodes[1], '(//parent[@id="foo"]/node[@id="bar"])[2]');
      });

      it('should use the next ancestor if parent is not unique and no node-local path could be found', function () {
        const doc = xmlToDOM(`<root>
          <parent>
            <parent>
              <node></node>
              <node></node>
            </parent>
          </parent>
        </root>`);
        const nodes = doc.getElementsByTagName('node');
        testXPath(doc, nodes[0], '/root/parent/parent/node[1]');
        testXPath(doc, nodes[1], '/root/parent/parent/node[2]');
      });

      it('should revert to the node-local path if the ancestor chain becomes too long', function () {
        const doc = xmlToDOM(`<root>
          <parent>
            <parent>
              <node id='bar'></node>
              <node id='bar'></node>
            </parent>
          </parent>
        </root>`);
        const nodes = doc.getElementsByTagName('node');
        testXPath(doc, nodes[0], '(//node[@id="bar"])[1]');
        testXPath(doc, nodes[1], '(//node[@id="bar"])[2]');
      });

      it('should use different indices for nodes with different tag names', function () {
        const doc = xmlToDOM(`<root>
          <parent>
            <node></node>
            <other-node></other-node>
            <node></node>
            <other-node></other-node>
          </parent>
        </root>`);
        const nodes = doc.getElementsByTagName('node');
        const otherNodes = doc.getElementsByTagName('other-node');
        testXPath(doc, nodes[0], '//parent/node[1]');
        testXPath(doc, nodes[1], '//parent/node[2]');
        testXPath(doc, otherNodes[0], '//parent/other-node[1]');
        testXPath(doc, otherNodes[1], '//parent/other-node[2]');
      });
    });

    // Tests with multiple nodes per parent are covered by the 'using multiple pairs of identical nodes' block
    describe('using individual identical nodes in multiple different parents', function () {
      it('should use parent tagnames if there are no other unique attributes', function () {
        const doc = xmlToDOM(`<root>
          <parent>
            <node></node>
          </parent>
          <other-parent>
            <node></node>
          </other-parent>
        </root>`);
        const nodes = doc.getElementsByTagName('node');
        testXPath(doc, nodes[0], '//parent/node');
        testXPath(doc, nodes[1], '//other-parent/node');
      });

      it('should use parent attributes if only the parent has them', function () {
        const doc = xmlToDOM(`<root>
          <parent id='foo'>
            <node></node>
          </parent>
          <parent id='baz'>
            <node></node>
          </parent>
        </root>`);
        const nodes = doc.getElementsByTagName('node');
        testXPath(doc, nodes[0], '//parent[@id="foo"]/node');
        testXPath(doc, nodes[1], '//parent[@id="baz"]/node');
      });

      it('should use parent tagnames and node attributes if only the node has attributes', function () {
        const doc = xmlToDOM(`<root>
          <parent>
            <node id='foo'></node>
          </parent>
          <other-parent>
            <node id='foo'></node>
          </other-parent>
        </root>`);
        const nodes = doc.getElementsByTagName('node');
        testXPath(doc, nodes[0], '//parent/node[@id="foo"]');
        testXPath(doc, nodes[1], '//other-parent/node[@id="foo"]');
      });

      it('should use parent and node attributes if both have them', function () {
        const doc = xmlToDOM(`<root>
          <parent id='foo'>
            <node id='baz'></node>
          </parent>
          <parent id='bar'>
            <node id='baz'></node>
          </parent>
        </root>`);
        const nodes = doc.getElementsByTagName('node');
        testXPath(doc, nodes[0], '//parent[@id="foo"]/node[@id="baz"]');
        testXPath(doc, nodes[1], '//parent[@id="bar"]/node[@id="baz"]');
      });
    });

    // Tests with multiple nodes per parent are covered by the 'using multiple pairs of identical nodes' block
    describe('using individual identical nodes in multiple identical parents', function () {
      it('should use the next ancestor if there are no unique attributes', function () {
        const doc = xmlToDOM(`<root>
          <parent>
            <node></node>
          </parent>
          <parent>
            <node></node>
          </parent>
        </root>`);
        const nodes = doc.getElementsByTagName('node');
        testXPath(doc, nodes[0], '/root/parent[1]/node');
        testXPath(doc, nodes[1], '/root/parent[2]/node');
      });

      it('should use the next ancestor if only the parent has unique attributes', function () {
        const doc = xmlToDOM(`<root>
          <parent id='foo'>
            <node></node>
          </parent>
          <parent id='foo'>
            <node></node>
          </parent>
        </root>`);
        const nodes = doc.getElementsByTagName('node');
        testXPath(doc, nodes[0], '/root/parent[1]/node');
        testXPath(doc, nodes[1], '/root/parent[2]/node');
      });

      it('should use the next ancestor and node attributes if only the node has unique attributes', function () {
        const doc = xmlToDOM(`<root>
          <parent>
            <node id='bar'></node>
          </parent>
          <parent>
            <node id='bar'></node>
          </parent>
        </root>`);
        const nodes = doc.getElementsByTagName('node');
        testXPath(doc, nodes[0], '/root/parent[1]/node[@id="bar"]');
        testXPath(doc, nodes[1], '/root/parent[2]/node[@id="bar"]');
      });

      it('should use the next ancestor and node attributes if both parent and node have unique attributes', function () {
        const doc = xmlToDOM(`<root>
          <parent id='foo'>
            <node id='bar'></node>
          </parent>
          <parent id='foo'>
            <node id='bar'></node>
          </parent>
        </root>`);
        const nodes = doc.getElementsByTagName('node');
        testXPath(doc, nodes[0], '/root/parent[1]/node[@id="bar"]');
        testXPath(doc, nodes[1], '/root/parent[2]/node[@id="bar"]');
      });
    });

    describe('using multiple pairs of identical nodes', function () {
      it('should use only attributes if there are no identical nodes under the same parent', function () {
        const doc = xmlToDOM(`<root>
          <parent id='foo'>
            <node id='baz'></node>
            <node id='quux'></node>
          </parent>
          <parent id='bar'>
            <node id='baz'></node>
            <node id='quux'></node>
          </parent>
        </root>`);
        const nodes = doc.getElementsByTagName('node');
        testXPath(doc, nodes[0], '//parent[@id="foo"]/node[@id="baz"]');
        testXPath(doc, nodes[1], '//parent[@id="foo"]/node[@id="quux"]');
        testXPath(doc, nodes[2], '//parent[@id="bar"]/node[@id="baz"]');
        testXPath(doc, nodes[3], '//parent[@id="bar"]/node[@id="quux"]');
      });

      it('should add an index if there are adjacent identical nodes', function () {
        const doc = xmlToDOM(`<root>
          <parent id='foo'>
            <node id='baz'></node>
            <node id='baz'></node>
          </parent>
          <parent id='bar'>
            <node id='baz'></node>
            <node id='baz'></node>
          </parent>
        </root>`);
        const nodes = doc.getElementsByTagName('node');
        testXPath(doc, nodes[0], '(//parent[@id="foo"]/node[@id="baz"])[1]');
        testXPath(doc, nodes[1], '(//parent[@id="foo"]/node[@id="baz"])[2]');
        testXPath(doc, nodes[2], '(//parent[@id="bar"]/node[@id="baz"])[1]');
        testXPath(doc, nodes[3], '(//parent[@id="bar"]/node[@id="baz"])[2]');
      });

      it('should use the next ancestor plus node attributes if there are adjacent identical parents', function () {
        const doc = xmlToDOM(`<root>
          <parent id='foo'>
            <node id='bar'></node>
            <node id='baz'></node>
          </parent>
          <parent id='foo'>
            <node id='bar'></node>
            <node id='baz'></node>
          </parent>
        </root>`);
        const nodes = doc.getElementsByTagName('node');
        testXPath(doc, nodes[0], '/root/parent[1]/node[@id="bar"]');
        testXPath(doc, nodes[1], '/root/parent[1]/node[@id="baz"]');
        testXPath(doc, nodes[2], '/root/parent[2]/node[@id="bar"]');
        testXPath(doc, nodes[3], '/root/parent[2]/node[@id="baz"]');
      });

      it('should use the next ancestor, node attributes and index if there are adjacent identical parents and nodes', function () {
        const doc = xmlToDOM(`<root>
          <parent id='foo'>
            <node id='bar'></node>
            <node id='bar'></node>
          </parent>
          <parent id='foo'>
            <node id='bar'></node>
            <node id='bar'></node>
          </parent>
        </root>`);
        const nodes = doc.getElementsByTagName('node');
        testXPath(doc, nodes[0], '(/root/parent[1]/node[@id="bar"])[1]');
        testXPath(doc, nodes[1], '(/root/parent[1]/node[@id="bar"])[2]');
        testXPath(doc, nodes[2], '(/root/parent[2]/node[@id="bar"])[1]');
        testXPath(doc, nodes[3], '(/root/parent[2]/node[@id="bar"])[2]');
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
