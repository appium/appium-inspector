import React, { Component } from 'react';
import HighlighterRect from './HighlighterRect';
import B from 'bluebird';
import { SCREENSHOT_INTERACTION_MODE, POINTER_TYPES, DEFAULT_TAP, DEFAULT_SWIPE } from './shared';

const {POINTER_UP, POINTER_DOWN, PAUSE, POINTER_MOVE} = POINTER_TYPES;
const {TAP, SWIPE, SELECT} = SCREENSHOT_INTERACTION_MODE;

/**
 * Shows screenshot of running application and divs that highlight the elements' bounding boxes
 */
export default class HighlighterRects extends Component {

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
           isLocatorTestModalVisible, scaleRatio} = this.props;

    // Recurse through the 'source' JSON and render a highlighter rect for each element
    const highlighterRects = [];

    let highlighterXOffset = 0;
    if (containerEl) {
      const screenshotEl = containerEl.querySelector('img');
      highlighterXOffset = screenshotEl.getBoundingClientRect().left -
                           containerEl.getBoundingClientRect().left;
    }

    let recursive = (element, zIndex = 0) => {
      if (!element) {
        return;
      }
      highlighterRects.push(<HighlighterRect {...this.props}
        element={element}
        zIndex={zIndex}
        scaleRatio={scaleRatio}
        key={element.path}
        xOffset={highlighterXOffset}
      />);

      if (element.children) {
        for (let childEl of element.children) {
          recursive(childEl, zIndex + 1);
        }
      }
    };

    // If the use selected an element that they searched for, highlight that element
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
      recursive(source);
    }

    return <div>{ highlighterRects }</div>;
  }
}
