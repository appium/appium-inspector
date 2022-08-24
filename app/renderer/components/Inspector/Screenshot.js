import React, { Component } from 'react';
import HighlighterRects from './HighlighterRects';
import { Spin, Tooltip } from 'antd';
import B from 'bluebird';
import styles from './Inspector.css';
import { SCREENSHOT_INTERACTION_MODE, INTERACTION_MODE, POINTER_TYPES,
         DEFAULT_TAP, DEFAULT_SWIPE } from './shared';
import { withTranslation } from '../../util';

const {POINTER_UP, POINTER_DOWN, PAUSE, POINTER_MOVE} = POINTER_TYPES;
const {TAP, SELECT, SWIPE} = SCREENSHOT_INTERACTION_MODE;
const TYPES = {FILLED: 'filled', NEW_DASHED: 'newDashed', WHOLE: 'whole', DASHED: 'dashed'};

/**
 * Shows screenshot of running application and divs that highlight the elements' bounding boxes
 */
class Screenshot extends Component {

  constructor (props) {
    super(props);
    this.containerEl = null;
    this.state = {
      x: null,
      y: null,
    };
  }

  async handleScreenshotClick () {
    const {screenshotInteractionMode, applyClientMethod,
           swipeStart, swipeEnd, setSwipeStart, setSwipeEnd, selectedTick, tapTickCoordinates} = this.props;
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
    } else if (selectedTick) {
      tapTickCoordinates(x, y);
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

  // retrieve and format gesture for svg drawings
  getGestureCoordinates () {
    const {FILLED, NEW_DASHED, WHOLE, DASHED} = TYPES;
    const {showGesture} = this.props;
    const defaultTypes = {pointerDown: WHOLE, pointerUp: DASHED};
    if (showGesture) {
      return showGesture.map((pointer) => {
        // 'type' is used to keep track of the last pointerup/pointerdown move
        let type = DASHED;
        const temp = [];
        for (const tick of pointer.ticks) {
          if (tick.type !== PAUSE) {
            const len = temp.length;
            type = tick.type !== POINTER_MOVE ? defaultTypes[tick.type] : type;
            if (tick.type === POINTER_MOVE && tick.x !== undefined && tick.y !== undefined) {
              temp.push({id: tick.id, type, x: tick.x, y: tick.y, color: pointer.color});
            }
            if (len === 0) {
              if (tick.type === POINTER_DOWN) {
                temp.push({id: tick.id, type: FILLED, x: 0, y: 0, color: pointer.color});
              }
            } else {
              if (tick.type === POINTER_DOWN && temp[len - 1].type === DASHED) {
                temp[len - 1].type = FILLED;
              }
              if (tick.type === POINTER_UP && temp[len - 1].type === WHOLE) {
                temp[len - 1].type = NEW_DASHED;
              }
            }
          }
        }
        return temp;
      });
    } else {
      return null;
    }
  }

  render () {
    const {
      screenshot,
      mjpegScreenshotUrl,
      methodCallInProgress,
      screenshotInteractionMode,
      swipeStart,
      swipeEnd,
      t,
      scaleRatio,
      selectedTick,
      selectedInteractionMode,
    } = this.props;
    const {x, y} = this.state;

    // If we're tapping or swiping, show the 'crosshair' cursor style
    const screenshotStyle = {};
    if ([TAP, SWIPE].includes(screenshotInteractionMode) || selectedTick) {
      screenshotStyle.cursor = 'crosshair';
    }

    let swipeInstructions = null;
    if (screenshotInteractionMode === SWIPE && (!swipeStart || !swipeEnd)) {
      if (!swipeStart) {
        swipeInstructions = t('Click swipe start point');
      } else if (!swipeEnd) {
        swipeInstructions = t('Click swipe end point');
      }
    }

    const screenSrc = mjpegScreenshotUrl || `data:image/gif;base64,${screenshot}`;
    const screenImg = <img src={screenSrc} id="screenshot" />;

    const points = this.getGestureCoordinates();

    // Show the screenshot and highlighter rects. Show loading indicator if a method call is in progress.
    return <Spin size='large' spinning={!!methodCallInProgress}>
      <div className={styles.innerScreenshotContainer}>
        <div ref={(containerEl) => { this.containerEl = containerEl; }}
          style={screenshotStyle}
          onClick={this.handleScreenshotClick.bind(this)}
          onMouseMove={this.handleMouseMove.bind(this)}
          onMouseOut={this.handleMouseOut.bind(this)}
          className={styles.screenshotBox}>
          {screenshotInteractionMode !== SELECT && <div className={styles.coordinatesContainer}>
            <p>{t('xCoordinate', {x})}</p>
            <p>{t('yCoordinate', {y})}</p>
          </div>}
          {swipeInstructions && <Tooltip visible={true} title={swipeInstructions} placement="topLeft">{screenImg}</Tooltip>}
          {!swipeInstructions && screenImg}
          {screenshotInteractionMode === SELECT && this.containerEl && <HighlighterRects
            {...this.props}
            containerEl={this.containerEl}
          />}
          {screenshotInteractionMode === SWIPE &&
            <svg className={styles.swipeSvg}>
              {swipeStart && !swipeEnd && <circle
                cx={swipeStart.x / scaleRatio}
                cy={swipeStart.y / scaleRatio}
              />}
              {swipeStart && swipeEnd && <line
                x1={swipeStart.x / scaleRatio}
                y1={swipeStart.y / scaleRatio}
                x2={swipeEnd.x / scaleRatio}
                y2={swipeEnd.y / scaleRatio}
              />}
            </svg>
          }
          {screenshotInteractionMode === TAP &&
            <div className={styles.tapDiv}></div>
          }
          {selectedInteractionMode === INTERACTION_MODE.GESTURES && points &&
            <svg key='gestureSVG' className={styles.gestureSvg}>
              {points.map((pointer) =>
                pointer.map((tick, index) =>
                  <>{index > 0 &&
                        <line
                          className={styles[tick.type]}
                          key={`${tick.id}.line`}
                          x1={pointer[index - 1].x / scaleRatio}
                          y1={pointer[index - 1].y / scaleRatio}
                          x2={tick.x / scaleRatio}
                          y2={tick.y / scaleRatio}
                          style={{stroke: tick.color}}
                        />}
                  <circle
                    className={styles[`circle-${tick.type}`]}
                    key={`${tick.id}.circle`}
                    cx={tick.x / scaleRatio}
                    cy={tick.y / scaleRatio}
                    style={tick.type === TYPES.FILLED ?
                      {fill: tick.color}
                      :
                      {stroke: tick.color}}/></>))}
            </svg>}
        </div>
      </div>
    </Spin>;
  }
}

export default withTranslation(Screenshot);
