import chai from 'chai';
import sinon from 'sinon';
import xpath from 'xpath';

import {
  areAttrAndValueUnique,
  getOptimalClassChain,
  getOptimalPredicateString,
  getOptimalUiAutomatorSelector,
  getOptimalXPath,
  getSimpleSuggestedLocators,
} from '../../app/common/utils/locator-generation';
import {domParser} from '../../app/common/utils/source-parsing';

const should = chai.should();

// Helper that checks that the optimal xpath for a node is the one that we expect and also
// checks that the XPath successfully locates the node in it's doc
function testXPath(doc, node, expectedXPath) {
  getOptimalXPath(doc, node).should.equal(expectedXPath);
  xpath.select(expectedXPath, doc)[0].should.equal(node);
}

// Helper for converting source from XML to Document format
function xmlToDoc(sourceXML) {
  return domParser.parseFromString(sourceXML);
}

describe('utils/locator-generation.js', function () {
  describe('#areAttrAndValueUnique', function () {
    it('should return false if two nodes have the same attribute value', function () {
      areAttrAndValueUnique(
        'id',
        'ID',
        xmlToDoc(`<root>
          <node id='ID'></node>
          <node id='ID'></node>
        </root>`),
      ).should.be.false;
    });

    it('should return false if two nodes have the same attribute value', function () {
      areAttrAndValueUnique(
        'id',
        'ID',
        xmlToDoc(`<root>
          <node id='ID'></node>
        </root>`),
      ).should.be.true;
      areAttrAndValueUnique(
        'id',
        'ID',
        xmlToDoc(`<root>
          <node></node>
          <node></node>
        </root>`),
      ).should.be.true;
    });

    it('should return true if no sourceXML was provided', function () {
      areAttrAndValueUnique('hello', 'world').should.be.true;
    });
  });

  describe('#getSimpleSuggestedLocators', function () {
    it('should find ID', function () {
      getSimpleSuggestedLocators({'resource-id': 'Resource ID'}).id.should.equal('Resource ID');
      getSimpleSuggestedLocators({id: 'ID'}).id.should.equal('ID');
      getSimpleSuggestedLocators({id: 'ID', 'resource-id': 'Resource ID'}).id.should.equal(
        'Resource ID',
      );
    });

    it('should not find ID if ID is not unique', function () {
      should.not.exist(
        getSimpleSuggestedLocators(
          {id: 'ID'},
          xmlToDoc(`<root>
            <node id='ID'></node>
            <node id='ID'></node>
          </root>`),
        ).id,
      );
    });

    it('should find accessibility id', function () {
      getSimpleSuggestedLocators({'content-desc': 'Content Desc'})['accessibility id'].should.equal(
        'Content Desc',
      );
      getSimpleSuggestedLocators({name: 'Name'})['accessibility id'].should.equal('Name');
      getSimpleSuggestedLocators(
        {name: 'Name'},
        xmlToDoc(`<root>
          <node content-desc='Name'></node>
        </root>`),
      )['accessibility id'].should.equal('Name');
      getSimpleSuggestedLocators({'content-desc': 'Content Desc', name: 'Name'})[
        'accessibility id'
      ].should.equal('Content Desc');
    });

    it('should not find accessibility ID if accessibility ID is not unique', function () {
      should.not.exist(
        getSimpleSuggestedLocators(
          {'content-desc': 'Content Desc'},
          xmlToDoc(`<root>
            <node content-desc='Content Desc'></node>
            <node content-desc='Content Desc'></node>
          </root>`),
        )['accessibility id'],
      );
    });

    it('should not find accessibility ID in non-native context', function () {
      should.not.exist(
        getSimpleSuggestedLocators(
          {'content-desc': 'Content Desc 1'},
          xmlToDoc(`<root>
            <node content-desc='Content Desc 1'></node>
            <node content-desc='Content Desc 2'></node>
          </root>`),
          false,
        )['accessibility id'],
      );
    });

    it('should find class name', function () {
      getSimpleSuggestedLocators({class: 'The Class'})['class name'].should.equal('The Class');
      getSimpleSuggestedLocators({type: 'The Type'})['class name'].should.equal('The Type');
      getSimpleSuggestedLocators(
        {class: 'The Class'},
        xmlToDoc(`<root>
          <node type='The Class'></node>
        </root>`),
      )['class name'].should.equal('The Class');
      getSimpleSuggestedLocators({class: 'The Class', type: 'The Type'})['class name'].should.equal(
        'The Type',
      );
    });

    it('should not find class name if class name is not unique', function () {
      should.not.exist(
        getSimpleSuggestedLocators(
          {class: 'The Class'},
          xmlToDoc(`<root>
            <node class='The Class'></node>
            <node class='The Class'></node>
          </root>`),
        )['class name'],
      );
    });
  });

  describe('#getOptimalXPath', function () {
    describe('on XML with height == 1', function () {
      it('should set an absolute xpath if attrName "id" is set', function () {
        const doc = xmlToDoc(`<node id='foo'></node>`);
        testXPath(doc, doc.getElementById('foo'), '//node[@id="foo"]');
      });

      it('should set an absolute xpath if unique attributes is set to "content-desc" and that attr is set', function () {
        const doc = xmlToDoc(`<node content-desc='foo'></node>`);
        testXPath(doc, doc.firstChild, '//node[@content-desc="foo"]');
      });

      it('should set relative xpath with tagname if no unique attributes are set', function () {
        const doc = xmlToDoc(`<node non-unique-attr='foo'></node>`);
        testXPath(doc, doc.firstChild, '/node');
      });
    });

    describe('on XML with height == 2', function () {
      let doc;

      it('should set first child node to relative xpath with tagname if the child node has no siblings', function () {
        doc = xmlToDoc(`<xml>
          <child-node non-unique-attr='hello'>Hello</child-node>
          <other-node>
            <child-node></child-node>
          </other-node>
        </xml>`);
        testXPath(doc, doc.getElementsByTagName('child-node')[0], '/xml/child-node');
      });

      it('should set first child node to relative xpath with tagname and index', function () {
        doc = xmlToDoc(`<xml>
          <child-node non-unique-attr='hello'>Hello</child-node>
          <child-node non-unique-attr='world'>World</child-node>
        </xml>`);
        testXPath(doc, doc.getElementsByTagName('child-node')[0], '/xml/child-node[1]');
        testXPath(doc, doc.getElementsByTagName('child-node')[1], '/xml/child-node[2]');
      });

      it('should set first child node to absolute xpath if it has ID set', function () {
        doc = xmlToDoc(`<xml>
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
        doc = xmlToDoc(`<xml>
          <child>Hello</child>
          <child-node>World</child-node>
          <child>Foo</child>
          <child-node>Bar</child-node>
        </xml>`);
        testXPath(doc, doc.getElementsByTagName('child')[0], '/xml/child[1]');
        testXPath(doc, doc.getElementsByTagName('child')[1], '/xml/child[2]');
        testXPath(doc, doc.getElementsByTagName('child-node')[0], '/xml/child-node[1]');
        testXPath(doc, doc.getElementsByTagName('child-node')[1], '/xml/child-node[2]');

        doc = xmlToDoc(`<xml>
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
        doc = xmlToDoc(`<root>
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

      it('should use indexes of children and grandchildren if no IDs are set', function () {
        doc = xmlToDoc(`<root>
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
        doc = xmlToDoc(`<root>
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
        doc = xmlToDoc(`<root>
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
        const xpathSelectStub = sinon.stub(xpath, 'select').callsFake(() => {
          throw new Error('Exception');
        });
        const doc = xmlToDoc(`<node id='foo'>
          <child id='a'></child>
          <child id='b'>
            <grandchild id='hello'></grandchild>
          </child>
        </node>`);
        getOptimalXPath(doc, doc.getElementById('hello')).should.equal('/node/child[2]/grandchild');
        xpathSelectStub.restore();
      });

      it('should return undefined if anything else throws an exception', function () {
        const doc = xmlToDoc(`<node id='foo'>
          <child id='a'></child>
          <child id='b'>
            <grandchild id='hello'></grandchild>
          </child>
        </node>`);
        const node = doc.getElementById('hello');
        node.getAttribute = () => {
          throw new Error('Some unexpected error');
        };
        should.not.exist(getOptimalXPath(doc, node));
      });
    });
  });

  describe('#getOptimalClassChain', function () {
    let doc;

    it('should use unique class chain attributes if the node has them', function () {
      doc = xmlToDoc(`<xml>
        <child-node label='hello'>Hello</child-node>
        <child-node label='world'>World</child-node>
      </xml>`);
      getOptimalClassChain(doc, doc.getElementsByTagName('child-node')[0]).should.equal(
        '/child-node[`label == "hello"`]',
      );
    });

    it('should use unique class chain attributes of parent if the node does not have them', function () {
      doc = xmlToDoc(`<root>
        <child name='foo'>
          <grandchild>Hello</grandchild>
          <grandchild>World</grandchild>
        </child>
      </root>`);
      getOptimalClassChain(doc, doc.getElementsByTagName('grandchild')[0]).should.equal(
        '/child[`name == "foo"`]/grandchild[1]',
      );
    });

    it('should use indices if neither the node nor its ancestors have any unique class chain attributes', function () {
      doc = xmlToDoc(`<root>
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
      getOptimalClassChain(doc, doc.getElementsByTagName('grandchild')[0]).should.equal(
        '/root/child[1]/grandchild[1]',
      );
    });
  });

  describe('#getOptimalPredicateString', function () {
    let doc;

    it('should exist if the node has unique predicate string attributes', function () {
      doc = xmlToDoc(`<xml>
        <child-node label='hello'>Hello</child-node>
        <child-node label='world'>World</child-node>
      </xml>`);
      getOptimalPredicateString(doc, doc.getElementsByTagName('child-node')[0]).should.equal(
        'label == "hello"',
      );
    });

    it('should not exist if the node does not have unique predicate string attributes', function () {
      doc = xmlToDoc(`<root>
        <child name='foo'>
          <grandchild>Hello</grandchild>
          <grandchild>World</grandchild>
        </child>
      </root>`);
      should.not.exist(getOptimalPredicateString(doc, doc.getElementsByTagName('grandchild')[0]));
    });
  });

  describe('#getOptimalUiAutomatorSelector', function () {
    let doc;

    it('should use unique UiAutomator attributes if the node has them', function () {
      doc = xmlToDoc(`<xml>
        <parent-node>
          <child-node resource-id='hello'>Hello</child-node>
          <child-node resource-id='world'>World</child-node>
        </parent-node>
      </xml>`);
      getOptimalUiAutomatorSelector(
        doc,
        doc.getElementsByTagName('child-node')[0],
        '0.0',
      ).should.equal('new UiSelector().resourceId("hello")');
    });

    it('should use indices if the valid node attributes are not unique', function () {
      doc = xmlToDoc(`<root>
        <child>
          <grandchild class='grandchild'>Hello</grandchild>
          <grandchild class='grandchild'>World</grandchild>
        </child>
      </root>`);
      getOptimalUiAutomatorSelector(
        doc,
        doc.getElementsByTagName('grandchild')[0],
        '0.0',
      ).should.equal('new UiSelector().className("grandchild").instance(0)');
    });

    it('should not exist if looking for element outside the last direct child of the hierarchy', function () {
      doc = xmlToDoc(`<root>
        <child>
          <grandchild resource-id='hello'>Hello</grandchild>
          <grandchild resource-id='world'>World</grandchild>
        </child>
        <child>
          <grandchild resource-id='foo'>Foo</grandchild>
          <grandchild resource-id='bar'>Bar</grandchild>
        </child>
      </root>`);
      should.not.exist(
        getOptimalUiAutomatorSelector(doc, doc.getElementsByTagName('grandchild')[0], '0.0'),
      );
    });
  });
});
