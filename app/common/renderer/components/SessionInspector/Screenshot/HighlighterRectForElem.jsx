import styles from './Screenshot.module.css';

/**
 * Absolute positioned divs that overlay the app screenshot and highlight the bounding
 * boxes of the elements in the app
 */
const HighlighterRectForElem = (props) => {
  const {
    hoveredElementPath,
    selectHoveredElement,
    unselectHoveredElement,
    selectedElementPath,
    selectElement,
    unselectElement,
    dimensions,
    element,
  } = props;

  const {width, height, left, top} = dimensions;
  const key = element.path;
  let highlighterClasses = [styles.highlighterBox];

  // Add class + special classes to hovered and selected elements
  if (hoveredElementPath === element.path) {
    highlighterClasses.push(styles.hoveredElementBox);
  }
  if (selectedElementPath === element.path) {
    highlighterClasses.push(styles.inspectedElementBox);
  }

  return (
    <div
      className={highlighterClasses.join(' ').trim()}
      onMouseOver={() => selectHoveredElement(key)}
      onMouseOut={unselectHoveredElement}
      onClick={() => (key === selectedElementPath ? unselectElement() : selectElement(key))}
      key={key}
      style={{left: left || 0, top: top || 0, width: width || 0, height: height || 0}}
    >
      <div></div>
    </div>
  );
};

export default HighlighterRectForElem;
