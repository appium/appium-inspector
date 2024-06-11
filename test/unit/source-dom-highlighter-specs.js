import chai from 'chai';
import {renderToString} from 'react-dom/server';

import {highlightNodeMatchingSearchTerm} from '../../app/renderer/src/components/Inspector/Source.jsx';

const should = chai.should();

describe('components/Inspector/Source.jsx', function () {
  describe('#highlightNodeMatchingSearchTerm', function () {
    it('should return the node text when search value is empty', function () {
      const nodeText = highlightNodeMatchingSearchTerm('android.widget.FrameLayout', '');
      nodeText.should.equal('android.widget.FrameLayout');
    });

    it('should return the node text when search value is undefined', function () {
      const nodeText = highlightNodeMatchingSearchTerm('android.widget.FrameLayout');
      nodeText.should.equal('android.widget.FrameLayout');
    });

    it('should return the node text when the value is undefined', function () {
      const nodeText = highlightNodeMatchingSearchTerm(undefined, 'widget');
      should.equal(nodeText, undefined);
    });

    it('should return the node text when the value is empty', function () {
      const nodeText = highlightNodeMatchingSearchTerm('', 'widget');
      nodeText.should.equal('');
    });

    it('should return the node text when search value is not matched', function () {
      const nodeText = highlightNodeMatchingSearchTerm('android.widget.FrameLayout', 'login');
      nodeText.should.equal('android.widget.FrameLayout');
    });

    it('should higlight the node text if a part of text matches the search value lowercase', function () {
      const nodeText = highlightNodeMatchingSearchTerm('android.Widget.FrameLayout', 'widget');
      renderToString(nodeText)
        .toString()
        .should.equal(
          'android.<span class="search-word-highlighted" data-match="widget">Widget</span>.FrameLayout',
        );
    });
  });
});
