import {CENTROID_STYLES, RENDER_CENTROID_AS} from '../../../../constants/screenshot.js';
import styles from './Overlays.module.css';

const {CENTROID, OVERLAP, EXPAND} = RENDER_CENTROID_AS;

const getCentroidStyle = (centroidType, elemProps, selectedCentroid, element) => {
  // Generate new coordinates along a circular trajectory
  // for overlapping elements only
  const centroidPos = (angle, coord) =>
    centroidType === OVERLAP ? `calc((${angle} * 2.6vh) + ${coord}px)` : coord;

  const overlapDivStyle = {
    visibility:
      elemProps.keyCode === selectedCentroid ? CENTROID_STYLES.VISIBLE : CENTROID_STYLES.HIDDEN,
  };

  return {
    left: centroidPos(elemProps.angleX, elemProps.centerX),
    top: centroidPos(elemProps.angleY, elemProps.centerY),
    borderRadius:
      element && !elemProps.container ? CENTROID_STYLES.NON_CONTAINER : CENTROID_STYLES.CONTAINER,
    ...(centroidType === OVERLAP ? overlapDivStyle : {}),
  };
};

const getCentroidClass = (centroidType, elemProps, selectedElemPath, selectedCentroid, element) => {
  const centroidClasses = [styles.centroidBox, styles[centroidType]];

  // Highlight centroids that represent elements
  if (centroidType !== EXPAND) {
    if (elemProps.path === selectedElemPath) {
      centroidClasses.push(styles.inspectedElementBox);
    }
  }

  // Highlight +/- centroids
  if (centroidType !== CENTROID) {
    if (elemProps.keyCode === selectedCentroid && !element) {
      centroidClasses.push(styles.inspectedElementBox);
    }
  }

  return centroidClasses.join(' ').trim();
};

/**
 * A single centroid overlaid on the app screenshot,
 * highlighting the centerpoint of an element or element group.
 */
const ElementCentroid = (props) => {
  const {
    selectedElementPath,
    element,
    elementProperties,
    selectElement,
    unselectElement,
    centroidType,
    selectedCentroid,
    selectCentroid,
    unselectCentroid,
  } = props;

  const onClickCentroid = () => {
    if (centroidType === EXPAND) {
      if (elementProperties.path === selectedCentroid) {
        unselectCentroid();
      } else {
        selectCentroid(elementProperties.path);
      }
    } else {
      if (elementProperties.path === selectedElementPath) {
        unselectElement();
      } else {
        selectElement(elementProperties.path);
      }
    }
  };

  const centroidClass = getCentroidClass(
    centroidType,
    elementProperties,
    selectedElementPath,
    selectedCentroid,
    element,
  );
  const centroidStyle = getCentroidStyle(
    centroidType,
    elementProperties,
    selectedCentroid,
    element,
  );

  return (
    <div className={centroidClass} onClick={() => onClickCentroid()} style={centroidStyle}>
      {centroidType === EXPAND && (
        <div className={styles.plusMinus}>
          {elementProperties.keyCode === selectedCentroid ? '-' : '+'}
        </div>
      )}
    </div>
  );
};

export default ElementCentroid;
