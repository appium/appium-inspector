import React, { Component } from 'react';
import InspectorCSS from './Inspector.css';
import { RENDER_CENTROID_AS } from './shared';

const {CENTROID, OVERLAP, EXPAND} = RENDER_CENTROID_AS;
const CENTROID_STYLES = {
  VISIBLE: 'visible',
  HIDDEN: 'hidden',
  CONTAINER: '50%',
  NON_CONTAINER: '0%',
};

// Generate new coordinates along a circlular trajectory
// for overlapping elements only
function getCentroidPos (type, angle, coord) {
  return type === OVERLAP ?
    `calc((${angle} * 2.6vh) + ${coord}px)`
    :
    coord;
}

/**
 * Shows all element centroids
 */
export default class HighlighterCentroid extends Component {

  onMouseEnter (path) {
    const {selectHoveredElement, selectHoveredCentroid,
           centroidType} = this.props;
    if (centroidType === EXPAND) {
      selectHoveredCentroid(path);
    } else {
      selectHoveredElement(path);
    }
  }

  onMouseLeave () {
    const {unselectHoveredElement, unselectHoveredCentroid,
           centroidType} = this.props;
    if (centroidType === EXPAND) {
      unselectHoveredCentroid();
    } else {
      unselectHoveredElement();
    }
  }

  onClickCentroid (path) {
    const {selectElement, unselectElement,
           selectCentroid, unselectCentroid, centroidType,
           selectedCentroid, selectedElementPath} = this.props;
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
  }

  render () {
    const {selectedElementPath, hoveredElement = {}, element, elementProperties,
           centroidType, hoveredCentroid, selectedCentroid} = this.props;
    const {path: hoveredPath} = hoveredElement;
    const {centerX, centerY, angleX, angleY,
           keyCode, path, container} = elementProperties;
    const centroidClasses = [InspectorCSS['centroid-box']];
    centroidClasses.push(InspectorCSS[centroidType]);

    // Highlght centroids that represent elements
    if (centroidType !== EXPAND) {
      if (hoveredPath === path) {
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
      visibility:
        keyCode === selectedCentroid ?
          CENTROID_STYLES.VISIBLE : CENTROID_STYLES.HIDDEN,
    };

    const centroidDivStyle = {
      left: getCentroidPos(centroidType, angleX, centerX),
      top: getCentroidPos(centroidType, angleY, centerY),
      borderRadius:
        element && !container ?
          CENTROID_STYLES.NON_CONTAINER : CENTROID_STYLES.CONTAINER,
      ...(centroidType === OVERLAP ? overlapDivStyle : {})
    };

    const placeHolder = centroidType === EXPAND ?
      <div className={InspectorCSS['plus-minus']}>
        {keyCode === selectedCentroid ? '-' : '+'}
      </div>
      :
      <div></div>;

    return <div
      className={centroidClasses.join(' ').trim()}
      onMouseOver={() => this.onMouseEnter(path)}
      onMouseOut={() => this.onMouseLeave()}
      onClick={() => this.onClickCentroid(path)}
      key={path}
      style={centroidDivStyle}>
      {placeHolder}
    </div>;
  }
}