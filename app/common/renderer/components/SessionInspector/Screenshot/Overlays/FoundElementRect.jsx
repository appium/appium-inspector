import styles from './Overlays.module.css';

/**
 * A single rectangle overlaid on the app screenshot,
 * highlighting the bounding box of an element found through element search.
 */
const FoundElementRect = ({elSize, elLocation, scaleRatio}) => {
  const highlighterClass = `${styles.highlighterBox} ${styles.inspectedElementBox}`;
  const highlighterStyle = {
    left: elLocation.x / scaleRatio,
    top: elLocation.y / scaleRatio,
    width: elSize.width / scaleRatio,
    height: elSize.height / scaleRatio,
  };

  return <div className={highlighterClass} style={highlighterStyle} />;
};

export default FoundElementRect;
