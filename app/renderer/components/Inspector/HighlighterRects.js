import React from 'react';

import {RENDER_CENTROID_AS} from '../../constants/screenshot';
import {parseCoordinates} from '../../utils/other';
import HighlighterCentroid from './HighlighterCentroid';
import HighlighterRectForBounds from './HighlighterRectForBounds';
import HighlighterRectForElem from './HighlighterRectForElem';

const {CENTROID, OVERLAP, EXPAND} = RENDER_CENTROID_AS;

/**
 * Shows screenshot of running application and divs that highlight the elements' bounding boxes
 */
const HighlighterRects = (props) => {
  const {
    sourceJSON,
    containerEl,
    searchedForElementBounds,
    scaleRatio,
    showCentroids,
    isLocatorTestModalVisible,
    isSiriCommandModalVisible,
  } = props;

  const highlighterRects = [];
  const highlighterCentroids = [];
  let highlighterXOffset = 0;
  let screenshotEl = null;

  const getElements = (sourceJSON) => {
    const elementsByOverlap = buildElementsWithProps(sourceJSON, null, [], {});
    let elements = [];

    // Adjust overlapping elements
    for (const key of Object.keys(elementsByOverlap)) {
      if (elementsByOverlap[key].length > 1) {
        const {centerX, centerY} = elementsByOverlap[key][0].properties;

        // Create new element obj which will be a +/- centroid

        const element = {
          type: EXPAND,
          element: null,
          parent: null,
          properties: {
            left: null,
            top: null,
            width: null,
            height: null,
            centerX,
            centerY,
            angleX: null,
            angleY: null,
            path: key,
            keyCode: key,
            container: null,
            accessible: null,
          },
        };
        elements = [...elements, element, ...updateOverlapsAngles(elementsByOverlap[key], key)];
      } else {
        elements.push(elementsByOverlap[key][0]);
      }
    }

    return elements;
  };

  // This func creates a new object for each element and determines its properties
  // 'elements' is an array that stores all prev elements
  // 'overlaps' is an object which organzies elements by their positions
  const buildElementsWithProps = (sourceJSON, prevElement, elements, overlaps) => {
    if (!sourceJSON) {
      return {};
    }
    const {x1, y1, x2, y2} = parseCoordinates(sourceJSON);
    const xOffset = highlighterXOffset || 0;
    const centerPoint = (v1, v2) => Math.round(v1 + (v2 - v1) / 2) / scaleRatio;
    const obj = {
      type: CENTROID,
      element: sourceJSON,
      parent: prevElement,
      properties: {
        left: x1 / scaleRatio + xOffset,
        top: y1 / scaleRatio,
        width: (x2 - x1) / scaleRatio,
        height: (y2 - y1) / scaleRatio,
        centerX: centerPoint(x1, x2) + xOffset,
        centerY: centerPoint(y1, y2),
        angleX: null,
        angleY: null,
        path: sourceJSON.path,
        keyCode: null,
        container: false,
        accessible: sourceJSON.attributes ? sourceJSON.attributes.accessible : null,
      },
    };
    const coordinates = `${obj.properties.centerX},${obj.properties.centerY}`;
    obj.properties.container = isElementContainer(obj, elements);

    elements.push(obj);

    if (sourceJSON.path) {
      if (overlaps[coordinates]) {
        overlaps[coordinates].push(obj);
      } else {
        overlaps[coordinates] = [obj];
      }
    }

    if (sourceJSON.children) {
      for (const childEl of sourceJSON.children) {
        buildElementsWithProps(childEl, sourceJSON, elements, overlaps);
      }
    }

    return overlaps;
  };

  const isElementContainer = (element1, elements) => {
    for (const element2 of elements) {
      if (
        element2.element !== element1.element &&
        isElementOverElement(element1.properties, element2.properties) &&
        !isAncestor(element1.parent, element2.element, elements)
      ) {
        return true;
      }
    }
    return false;
  };

  const isElementOverElement = (element1, element2) =>
    element1.left <= element2.left &&
    element1.width >= element2.width &&
    element1.top >= element2.top &&
    element1.height >= element2.height;

  // Traverse through parent elements until we reach maybeAncestor
  const isAncestor = (curElement, maybeAncestor, elements) => {
    if (elements.length > 0) {
      while (curElement !== null) {
        if (curElement === maybeAncestor) {
          return true;
        }

        for (const elem of elements) {
          if (elem.element === curElement) {
            curElement = elem.parent;
          }
        }
      }
    }
    return false;
  };

  // Generate angles for circular positioning for overlaping elements
  const updateOverlapsAngles = (elements, key) => {
    const steps = elements.length;
    for (let step = 0; step < steps; step++) {
      const [el, elProps] = [elements[step], elements[step].properties];
      el.type = OVERLAP;
      elProps.keyCode = key;
      elProps.angleX = Math.cos(2 * Math.PI * (step / steps));
      elProps.angleY = Math.sin(2 * Math.PI * (step / steps));
    }
    return elements;
  };

  // Displays element rectangles only
  const renderElements = (elements) => {
    for (const elem of elements) {
      // only render elements with non-zero height and width
      if (!elem.properties.width || !elem.properties.height) {
        continue;
      }
      highlighterRects.push(
        <HighlighterRectForElem
          {...props}
          dimensions={elem.properties}
          element={elem.element}
          key={elem.properties.path}
        />,
      );
    }
  };

  // Displays centroids only
  const renderCentroids = (centroids) => {
    for (const elem of centroids) {
      highlighterCentroids.push(
        <HighlighterCentroid
          {...props}
          centroidType={elem.type}
          elementProperties={elem.properties}
          element={elem.element}
          key={elem.properties.path}
        />,
      );
    }
  };

  // Array of all element objects with properties to draw rectangles and/or centroids
  const elements = getElements(sourceJSON);

  if (containerEl) {
    screenshotEl = containerEl.querySelector('img');
    highlighterXOffset =
      screenshotEl.getBoundingClientRect().left - containerEl.getBoundingClientRect().left;
  }

  // If the user selected an element that they searched for, highlight that element
  if (searchedForElementBounds && isLocatorTestModalVisible) {
    const {location, size} = searchedForElementBounds;
    highlighterRects.push(
      <HighlighterRectForBounds
        elSize={size}
        elLocation={location}
        scaleRatio={scaleRatio}
        key={`el.${location.x}.${location.y}.${size.width}.${size.height}`}
        xOffset={highlighterXOffset}
      />,
    );
  }

  // Don't show highlighter rects when Search Elements modal is open
  if (!isLocatorTestModalVisible && !isSiriCommandModalVisible) {
    renderElements(elements);
    if (showCentroids) {
      renderCentroids(elements);
    }
  }

  return (
    <div>
      {highlighterRects}
      {highlighterCentroids}
    </div>
  );
};

export default HighlighterRects;
