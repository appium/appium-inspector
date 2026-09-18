import styles from './Overlays.module.css';

/**
 * A box overlay shown in the top left corner of the app screenshot,
 * showing the current screen coordinates.
 */
const CoordinatesContainer = ({x, y}) => (
  <div className={styles.coordinatesContainer}>
    <p>{`X: ${x ?? ''}`}</p>
    <p>{`Y: ${y ?? ''}`}</p>
  </div>
);

export default CoordinatesContainer;
