import styles from './Screenshot.module.css';

/**
 * Absolute positioned divs that overlay the app screenshot and highlight the bounding
 * boxes of the elements in the app
 */
const HighlighterRectForElem = (props) => {
  const {selectedElementPath, selectElement, unselectElement, properties, path} = props;

  const {width, height, left, top} = properties;
  const highlighterClasses = [styles.highlighterBox];

  // Add class to selected elements
  if (selectedElementPath === path) {
    highlighterClasses.push(styles.inspectedElementBox);
  }

  return (
    <div
      className={highlighterClasses.join(' ').trim()}
      onClick={() => (path === selectedElementPath ? unselectElement() : selectElement(path))}
      style={{left: left || 0, top: top || 0, width: width || 0, height: height || 0}}
    >
      <div></div>
    </div>
  );
};

export default HighlighterRectForElem;
