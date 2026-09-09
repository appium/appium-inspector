import styles from './Overlays.module.css';

/**
 * Points and lines overlaid on the app screenshot,
 * showing positions of the currently executing screenshot tap or swipe.
 */
const TapSwipeTrail = ({coordStart, coordEnd, x, y, scaleRatio}) => {
  if (!coordStart?.x || !coordStart?.y) {
    return;
  }

  const scale = (val) => val / scaleRatio;

  return (
    <svg className={styles.swipeSvg}>
      <circle cx={scale(coordStart.x)} cy={scale(coordStart.y)} r={10} />
      <line
        x1={scale(coordStart.x)}
        y1={scale(coordStart.y)}
        x2={scale(coordEnd?.x ?? x)}
        y2={scale(coordEnd?.y ?? y)}
      />
    </svg>
  );
};

export default TapSwipeTrail;
