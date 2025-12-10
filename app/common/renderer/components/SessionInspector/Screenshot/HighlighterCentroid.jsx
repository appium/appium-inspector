import {CENTROID_STYLES, RENDER_CENTROID_AS} from '../../../constants/screenshot.js';
import styles from './Screenshot.module.css';

const {CENTROID, OVERLAP, EXPAND} = RENDER_CENTROID_AS;

// Generate new coordinates along a circlular trajectory
// for overlapping elements only
const getCentroidPos = (type, angle, coord) => {
  if (type === OVERLAP) {
    return `calc((${angle} * 2.6vh) + ${coord}px)`;
  }
  return coord;
};

/**
 * Shows all element centroids
 */
const HighlighterCentroid = (props) => {
  const {
    selectedElementPath,
    element,
    elementProperties,
    centroidType,
    selectedCentroid,
  } = props;
  const {centerX, centerY, angleX, angleY, keyCode, path, container} = elementProperties;

  const onClickCentroid = (path) => {
    const {selectElement, unselectElement, selectCentroid, unselectCentroid} = props;
    if (centroidType === EXPAND) {
      if (path === selectedCentroid) {
        unselectCentroid();
      } else {
        selectCentroid(path);
      }
    } else {
      if (path === selectedElementPath) {
        unselectElement();
      } else {
        selectElement(path);
      }
    }
  };

  const centroidClasses = [styles.centroidBox];
  centroidClasses.push(styles[centroidType]);

  // Highlight centroids that represent elements
  if (centroidType !== EXPAND) {
    if (selectedElementPath === path) {
      centroidClasses.push(styles.inspectedElementBox);
    }
  }

  // Highlight +/- centroids
  if (centroidType !== CENTROID) {
    if (selectedCentroid === keyCode && !element) {
      centroidClasses.push(styles.inspectedElementBox);
    }
  }

  const overlapDivStyle = {
    visibility: keyCode === selectedCentroid ? CENTROID_STYLES.VISIBLE : CENTROID_STYLES.HIDDEN,
  };

  const centroidDivStyle = {
    left: getCentroidPos(centroidType, angleX, centerX),
    top: getCentroidPos(centroidType, angleY, centerY),
    borderRadius: element && !container ? CENTROID_STYLES.NON_CONTAINER : CENTROID_STYLES.CONTAINER,
    ...(centroidType === OVERLAP ? overlapDivStyle : {}),
  };

  const placeHolder =
    centroidType === EXPAND ? (
      <div className={styles.plusMinus}>{keyCode === selectedCentroid ? '-' : '+'}</div>
    ) : (
      <div></div>
    );

  return (
    <div
      className={centroidClasses.join(' ').trim()}
      onClick={() => onClickCentroid(path)}
      key={path}
      style={centroidDivStyle}
    >
      {placeHolder}
    </div>
  );
};

export default HighlighterCentroid;
