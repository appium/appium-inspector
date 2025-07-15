import InspectorCSS from './Inspector.module.css';

/**
 * Single absolute positioned div that overlays the app screenshot and highlights the bounding
 * box of the element found through element search
 */
const HighlighterRectForBounds = ({elSize, elLocation, scaleRatio, xOffset}) => (
  <div
    className={`${InspectorCSS['highlighter-box']} ${InspectorCSS['inspected-element-box']}`}
    // Unique keys are assigned to elements by their x & y coordinates
    key={`searchedForElement{x: ${elLocation.x}, y: ${elLocation.y}}`}
    style={{
      left: elLocation.x / scaleRatio + xOffset,
      top: elLocation.y / scaleRatio,
      width: elSize.width / scaleRatio,
      height: elSize.height / scaleRatio,
    }}
  >
    <div></div>
  </div>
);

export default HighlighterRectForBounds;
