import styles from './Overlays.module.css';

/**
 * Points and lines overlaid on the app screenshot,
 * showing positions of the currently executing screenshot tap or swipe.
 */
const TapSwipeTrail = ({coordStart, coordEnd, x, y, scaleRatio}) => (
  <svg className={styles.swipeSvg}>
    {coordStart && <circle cx={coordStart.x / scaleRatio} cy={coordStart.y / scaleRatio} r={10} />}
    {coordStart && !coordEnd && (
      <line
        x1={coordStart.x / scaleRatio}
        y1={coordStart.y / scaleRatio}
        x2={x / scaleRatio}
        y2={y / scaleRatio}
      />
    )}
    {coordStart && coordEnd && (
      <line
        x1={coordStart.x / scaleRatio}
        y1={coordStart.y / scaleRatio}
        x2={coordEnd.x / scaleRatio}
        y2={coordEnd.y / scaleRatio}
      />
    )}
  </svg>
);

export default TapSwipeTrail;
