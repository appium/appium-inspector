import React, { Component } from 'react';
import HighlighterRect from './HighlighterRect';
import HighlighterCentroid from './HighlighterCentroid';
import B from 'bluebird';
import { SCREENSHOT_INTERACTION_MODE, parseCoordinates,
         RENDER_CENTROID_AS, POINTER_TYPES, DEFAULT_TAP,
         DEFAULT_SWIPE } from './shared';

const {POINTER_UP, POINTER_DOWN, PAUSE, POINTER_MOVE} = POINTER_TYPES;
const {TAP, SWIPE, SELECT} = SCREENSHOT_INTERACTION_MODE;
const {CENTROID, OVERLAP, EXPAND} = RENDER_CENTROID_AS;

/**
 * Shows screenshot of running application and divs that highlight the elements' bounding boxes
 */
export default class HighlighterRects extends Component {

  getElements (source) {
    const elementsByOverlap = this.buildElementsWithProps(source, null, [], {});
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
          ...this.updateOverlapsAngles(elementsByOverlap[key], key)];
      } else {
        elements.push(elementsByOverlap[key][0]);
      }
    }

    return elements;
  }

  // This func creates a new object for each element and determines its properties
  // 'elements' is an array that stores all prev elements
  // 'overlaps' is an object which organzies elements by their positions
  buildElementsWithProps (source, prevElement, elements, overlaps) {
    if (!source) {
      return {};
    }
    const {scaleRatio} = this.props;
    const {x1, y1, x2, y2} = parseCoordinates(source);
    const xOffset = this.highlighterXOffset || 0;
    const centerPoint = (v1, v2) =>
      Math.round(v1 + ((v2 - v1) / 2)) / scaleRatio;
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
        accessible: source.attributes.accessible
      }
    };
    const coordinates = `${obj.properties.centerX}.${obj.properties.centerY}`;
    obj.properties.container = this.isElementContainer(obj, elements);

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
        this.buildElementsWithProps(childEl, source, elements, overlaps);
      }
    }

    return overlaps;
  }

  isElementContainer (element1, elements) {
    for (const element2 of elements) {
      if (element2.element !== element1.element
        && this.isElementOverElement(element1.properties, element2.properties)
        && !this.isAncestor(element1.parent, element2.element, elements)) {
        return true;
      }
    }
    return false;
  }

  isElementOverElement (element1, element2) {
    return element1.left <= element2.left
        && element1.width >= element2.width
        && element1.top >= element2.top
        && element1.height >= element2.height;
  }

  // Traverse through parent elements until we reach maybeAncestor
  isAncestor (curElement, maybeAncestor, elements) {
    if (elements.length > 0) {
      while (curElement !== null) {
        if (curElement === maybeAncestor) { return true; }

        for (const elem of elements) {
          if (elem.element === curElement) { curElement = elem.parent; }
        }
      }
    }
    return false;
  }

  // Generate angles for circular positioning for overlaping elements
  updateOverlapsAngles (elements, key) {
    const steps = elements.length;
    for (let step = 0; step < steps; step++) {
      const [el, elProps] = [elements[step], elements[step].properties];
      el.type = OVERLAP;
      elProps.keyCode = key;
      elProps.angleX = Math.cos(2 * Math.PI * (step / steps));
      elProps.angleY = Math.sin(2 * Math.PI * (step / steps));
    }
    return elements;
  }

  async handleScreenshotClick () {
    const {screenshotInteractionMode, applyClientMethod,
           swipeStart, swipeEnd, setSwipeStart, setSwipeEnd} = this.props;
    const {x, y} = this.state;
    const {POINTER_NAME, DURATION_1, DURATION_2, BUTTON} = DEFAULT_TAP;

    if (screenshotInteractionMode === TAP) {
      applyClientMethod({
        methodName: TAP,
        args: [
          {
            [POINTER_NAME]: [
              {type: POINTER_MOVE, duration: DURATION_1, x, y},
              {type: POINTER_DOWN, button: BUTTON},
              {type: PAUSE, duration: DURATION_2},
              {type: POINTER_UP, button: BUTTON}
            ],
          }
        ],
      });
    } else if (screenshotInteractionMode === SWIPE) {
      if (!swipeStart) {
        setSwipeStart(x, y);
      } else if (!swipeEnd) {
        setSwipeEnd(x, y);
        await B.delay(500); // Wait a second to do the swipe so user can see the SVG line
        await this.handleDoSwipe();
      }
    }
  }

  handleMouseMove (e) {
    const {screenshotInteractionMode, scaleRatio} = this.props;

    if (screenshotInteractionMode !== SELECT) {
      const offsetX = e.nativeEvent.offsetX;
      const offsetY = e.nativeEvent.offsetY;
      const x = offsetX * scaleRatio;
      const y = offsetY * scaleRatio;
      this.setState({
        ...this.state,
        x: Math.round(x),
        y: Math.round(y),
      });
    }
  }

  handleMouseOut () {
    this.setState({
      ...this.state,
      x: null,
      y: null,
    });
  }

  async handleDoSwipe () {
    const {swipeStart, swipeEnd, clearSwipeAction, applyClientMethod} = this.props;
    const {POINTER_NAME, DURATION_1, DURATION_2, BUTTON, ORIGIN} = DEFAULT_SWIPE;
    await applyClientMethod({
      methodName: SWIPE,
      args: {[POINTER_NAME]: [
        {type: POINTER_MOVE, duration: DURATION_1, x: swipeStart.x, y: swipeStart.y},
        {type: POINTER_DOWN, button: BUTTON},
        {type: POINTER_MOVE, duration: DURATION_2, origin: ORIGIN, x: swipeEnd.x, y: swipeEnd.y},
        {type: POINTER_UP, button: BUTTON}
      ]},
    });
    clearSwipeAction();
  }

  render () {
    const {source, screenshotInteractionMode, containerEl, searchedForElementBounds,
           isLocatorTestModalVisible, scaleRatio, showCentroids} = this.props;

    // Array of all element objects with properties to draw rectangles and/or centroids
    const elements = this.getElements(source);

    const highlighterRects = [];
    const highlighterCentroids = [];
    let highlighterXOffset = 0;
    let screenshotEl = null;

    if (containerEl) {
      screenshotEl = containerEl.querySelector('img');
      highlighterXOffset = screenshotEl.getBoundingClientRect().left -
                           containerEl.getBoundingClientRect().left;
    }

    // Displays element rectangles only
    let renderElements = (source) => {
      for (const elem of source) {
        highlighterRects.push(<HighlighterRect {...this.props}
          dimensions={elem.properties}
          element={elem.element}
          scaleRatio={scaleRatio}
          key={elem.properties.path}
          xOffset={highlighterXOffset}
        />);
      }
    };

    // Displays centroids only
    let renderCentroids = (centroids) => {
      for (const elem of centroids) {
        highlighterCentroids.push(<HighlighterCentroid {...this.props}
          centroidType={elem.type}
          elementProperties={elem.properties}
          element={elem.element}
          key={elem.properties.path}
        />);
      }
    };

    // If the user selected an element that they searched for, highlight that element
    if (searchedForElementBounds && isLocatorTestModalVisible) {
      const {location: elLocation, size} = searchedForElementBounds;
      highlighterRects.push(<HighlighterRect elSize={size} elLocation={elLocation} scaleRatio={scaleRatio} xOffset={highlighterXOffset} />);
    }

    // If we're tapping or swiping, show the 'crosshair' cursor style
    const screenshotStyle = {};
    if ([TAP, SWIPE].includes(screenshotInteractionMode)) {
      screenshotStyle.cursor = 'crosshair';
    }

    // Don't show highlighter rects when Search Elements modal is open
    if (!isLocatorTestModalVisible) {
      renderElements(elements);
      if (showCentroids) {
        renderCentroids(elements);
      }
    }

    return <div>{ highlighterRects }{ highlighterCentroids }</div>;
  }
}
