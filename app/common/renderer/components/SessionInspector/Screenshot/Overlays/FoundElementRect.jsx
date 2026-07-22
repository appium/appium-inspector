import styles from './Overlays.module.css';

/**
 * A single rectangle overlaid on the app screenshot,
 * highlighting the bounding box of an element found through element search.
 */
const FoundElementRect = ({searchedForElementBounds, scaleRatio}) => {
  const {location, size} = searchedForElementBounds;

  const highlighterClass = `${styles.highlighterBox} ${styles.inspectedElementBox}`;
  const highlighterStyle = {
    left: location.x / scaleRatio,
    top: location.y / scaleRatio,
    width: size.width / scaleRatio,
    height: size.height / scaleRatio,
  };

  return <div className={highlighterClass} style={highlighterStyle} />;
};

export default FoundElementRect;
