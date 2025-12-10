import styles from './Screenshot.module.css';

/**
 * Absolute positioned divs that overlay the app screenshot and highlight the bounding
 * boxes of the elements in the app
 */
const HighlighterRectForElem = (props) => {
  const {selectedElementPath, selectElement, unselectElement, properties, path} = props;

  const {width = 0, height = 0, left = 0, top = 0} = properties;
  const highlighterClasses = [styles.highlighterBox];

  // Add class to selected elements
  if (selectedElementPath === path) {
    highlighterClasses.push(styles.inspectedElementBox);
  }

  return (
    <div
      className={highlighterClasses.join(' ').trim()}
      onClick={() => (path === selectedElementPath ? unselectElement() : selectElement(path))}
      style={{left, top, width, height}}
    />
  );
};

export default HighlighterRectForElem;
