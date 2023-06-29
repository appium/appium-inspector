import React from 'react';
import HighlighterRect from './HighlighterRect';
import HighlighterCentroid from './HighlighterCentroid';
import { parseCoordinates, RENDER_CENTROID_AS } from './shared';

const { CENTROID, OVERLAP, EXPAND } = RENDER_CENTROID_AS;

/**
 * Shows screenshot of running application and divs that highlight the elements' bounding boxes
 */
const HighlighterRects = (props) => {
  const { source, containerEl, searchedForElementBounds, scaleRatio, showCentroids,
          isLocatorTestModalVisible, isSiriCommandModalVisible } = props;

  const highlighterRects = [];
  const highlighterCentroids = [];
  let highlighterXOffset = 0;
  let screenshotEl = null;

  const getElements = (source) => {
    const elementsByOverlap = buildElementsWithProps(source, null, [], {});
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
            accessible: null
          }
        };
        elements = [...elements, element,
          ...updateOverlapsAngles(elementsByOverlap[key], key)];
      } else {
        elements.push(elementsByOverlap[key][0]);
      }
    }

    return elements;
  };

  // This func creates a new object for each element and determines its properties
  // 'elements' is an array that stores all prev elements
  // 'overlaps' is an object which organzies elements by their positions
  const buildElementsWithProps = (source, prevElement, elements, overlaps) => {
    if (!source) { return {}; }
    const { x1, y1, x2, y2 } = parseCoordinates(source);
    const xOffset = highlighterXOffset || 0;
    const centerPoint = (v1, v2) => Math.round(v1 + ((v2 - v1) / 2)) / scaleRatio;
    const obj = {
      type: CENTROID,
      element: source,
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
        path: source.path,
        keyCode: null,
        container: false,
        accessible: source.attributes ? source.attributes.accessible : null
      }
    };
    const coordinates = `${obj.properties.centerX}.${obj.properties.centerY}`;
    obj.properties.container = isElementContainer(obj, elements);

    elements.push(obj);

    if (source.path) {
      if (overlaps[coordinates]) {
        overlaps[coordinates].push(obj);
      } else {
        overlaps[coordinates] = [obj];
      }
    }

    if (source.children) {
      for (const childEl of source.children) {
        buildElementsWithProps(childEl, source, elements, overlaps);
      }
    }

    return overlaps;
  };

  const isElementContainer = (element1, elements) => {
    for (const element2 of elements) {
      if (element2.element !== element1.element
        && isElementOverElement(element1.properties, element2.properties)
        && !isAncestor(element1.parent, element2.element, elements)) {
        return true;
      }
    }
    return false;
  };

  const isElementOverElement = (element1, element2) =>
    element1.left <= element2.left
      && element1.width >= element2.width
      && element1.top >= element2.top
      && element1.height >= element2.height;

  // Traverse through parent elements until we reach maybeAncestor
  const isAncestor = (curElement, maybeAncestor, elements) => {
    if (elements.length > 0) {
      while (curElement !== null) {
        if (curElement === maybeAncestor) { return true; }

        for (const elem of elements) {
          if (elem.element === curElement) { curElement = elem.parent; }
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
  const renderElements = (source) => {
    for (const elem of source) {
      highlighterRects.push(
        <HighlighterRect {...props}
          dimensions={elem.properties}
          element={elem.element}
          scaleRatio={scaleRatio}
          key={elem.properties.path}
          xOffset={highlighterXOffset} />
      );
    }
  };

  // Displays centroids only
  const renderCentroids = (centroids) => {
    for (const elem of centroids) {
      highlighterCentroids.push(
        <HighlighterCentroid {...props}
          centroidType={elem.type}
          elementProperties={elem.properties}
          element={elem.element}
          key={elem.properties.path} />
      );
    }
  };

  // Array of all element objects with properties to draw rectangles and/or centroids
  const elements = getElements(source);

  if (containerEl) {
    screenshotEl = containerEl.querySelector('img');
    highlighterXOffset = screenshotEl.getBoundingClientRect().left -
                         containerEl.getBoundingClientRect().left;
  }

  // If the user selected an element that they searched for, highlight that element
  if (searchedForElementBounds && isLocatorTestModalVisible) {
    const {location: elLocation, size} = searchedForElementBounds;
    highlighterRects.push(
      <HighlighterRect
        elSize={size}
        elLocation={elLocation}
        scaleRatio={scaleRatio}
        xOffset={highlighterXOffset} />
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
