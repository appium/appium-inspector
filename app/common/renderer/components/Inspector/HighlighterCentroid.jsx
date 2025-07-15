import {CENTROID_STYLES, RENDER_CENTROID_AS} from '../../constants/screenshot';
import InspectorCSS from './Inspector.module.css';

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
    hoveredElement = {},
    element,
    elementProperties,
    centroidType,
    hoveredCentroid,
    selectedCentroid,
  } = props;
  const {centerX, centerY, angleX, angleY, keyCode, path, container} = elementProperties;

  const onMouseEnter = (path) => {
    const {selectHoveredElement, selectHoveredCentroid} = props;
    if (centroidType === EXPAND) {
      selectHoveredCentroid(path);
    } else {
      selectHoveredElement(path);
    }
  };

  const onMouseLeave = () => {
    const {unselectHoveredElement, unselectHoveredCentroid} = props;
    if (centroidType === EXPAND) {
      unselectHoveredCentroid();
    } else {
      unselectHoveredElement();
    }
  };

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

  const centroidClasses = [InspectorCSS['centroid-box']];
  centroidClasses.push(InspectorCSS[centroidType]);

  // Highlight centroids that represent elements
  if (centroidType !== EXPAND) {
    if (hoveredElement.path === path) {
      centroidClasses.push(InspectorCSS['hovered-element-box']);
    }
    if (selectedElementPath === path) {
      centroidClasses.push(InspectorCSS['inspected-element-box']);
    }
  }

  // Highlight +/- centroids
  if (centroidType !== CENTROID) {
    if (hoveredCentroid === keyCode) {
      centroidClasses.push(InspectorCSS['hovered-element-box']);
    }
    if (selectedCentroid === keyCode && !element) {
      centroidClasses.push(InspectorCSS['inspected-element-box']);
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
      <div className={InspectorCSS['plus-minus']}>{keyCode === selectedCentroid ? '-' : '+'}</div>
    ) : (
      <div></div>
    );

  return (
    <div
      className={centroidClasses.join(' ').trim()}
      onMouseOver={() => onMouseEnter(path)}
      onMouseOut={() => onMouseLeave()}
      onClick={() => onClickCentroid(path)}
      key={path}
      style={centroidDivStyle}
    >
      {placeHolder}
    </div>
  );
};

export default HighlighterCentroid;
