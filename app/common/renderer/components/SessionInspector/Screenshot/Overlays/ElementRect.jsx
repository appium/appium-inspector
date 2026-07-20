import styles from './Overlays.module.css';

const getHighlighterClass = (elemPath, selectedElementPath) => {
  const highlighterClasses = [styles.highlighterBox];

  // Highlight selected elements
  if (elemPath === selectedElementPath) {
    highlighterClasses.push(styles.inspectedElementBox);
  }

  return highlighterClasses.join(' ').trim();
};

/**
 * A single rectangle overlaid on the app screenshot,
 * highlighting the bounding box of an element in the app source.
 */
const ElementRect = ({selectedElementPath, selectElement, unselectElement, elemProperties}) => {
  const onClickHighlighter = () => {
    if (elemProperties.path === selectedElementPath) {
      unselectElement();
    } else {
      selectElement(elemProperties.path);
    }
  };

  const highlighterClass = getHighlighterClass(elemProperties.path, selectedElementPath);
  const highlighterStyle = {
    left: elemProperties.left ?? 0,
    top: elemProperties.top ?? 0,
    width: elemProperties.width ?? 0,
    height: elemProperties.height ?? 0,
  };

  return (
    <div
      className={highlighterClass}
      onClick={() => onClickHighlighter()}
      style={highlighterStyle}
    />
  );
};

export default ElementRect;
