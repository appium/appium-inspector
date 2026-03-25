import {describe, expect, it} from 'vitest';

import {
  areAttrAndValueUnique,
  getSimpleSuggestedLocators,
  isTagUnique,
} from '../../../app/common/renderer/utils/locator-generation/simple.js';
import {xmlToDOM} from '../../../app/common/renderer/utils/source-parsing.js';

describe('utils/locator-generation/simple.js', function () {
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
});
