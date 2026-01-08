import styles from './Screenshot.module.css';

/**
 * Single absolute positioned div that overlays the app screenshot and highlights the bounding
 * box of the element found through element search
 */
const HighlighterRectForBounds = ({elSize, elLocation, scaleRatio}) => (
  <div
    className={`${styles.highlighterBox} ${styles.inspectedElementBox}`}
    style={{
      left: elLocation.x / scaleRatio,
      top: elLocation.y / scaleRatio,
      width: elSize.width / scaleRatio,
      height: elSize.height / scaleRatio,
    }}
  />
);

export default HighlighterRectForBounds;
