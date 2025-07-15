import InspectorCSS from './Inspector.module.css';

/**
 * Absolute positioned divs that overlay the app screenshot and highlight the bounding
 * boxes of the elements in the app
 */
const HighlighterRectForElem = (props) => {
  const {
    hoveredElement = {},
    selectHoveredElement,
    unselectHoveredElement,
    selectedElement = {},
    selectElement,
    unselectElement,
    dimensions,
    element,
  } = props;

  const {width, height, left, top} = dimensions;
  const key = element.path;
  let highlighterClasses = [InspectorCSS['highlighter-box']];

  // Add class + special classes to hovered and selected elements
  if (hoveredElement.path === element.path) {
    highlighterClasses.push(InspectorCSS['hovered-element-box']);
  }
  if (selectedElement.path === element.path) {
    highlighterClasses.push(InspectorCSS['inspected-element-box']);
  }

  return (
    <div
      className={highlighterClasses.join(' ').trim()}
      onMouseOver={() => selectHoveredElement(key)}
      onMouseOut={unselectHoveredElement}
      onClick={() => (key === selectedElement.path ? unselectElement() : selectElement(key))}
      key={key}
      style={{left: left || 0, top: top || 0, width: width || 0, height: height || 0}}
    >
      <div></div>
    </div>
  );
};

export default HighlighterRectForElem;
