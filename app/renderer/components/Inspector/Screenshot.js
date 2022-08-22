import React, { Component } from 'react';
import HighlighterRects from './HighlighterRects';
import { Spin, Tooltip } from 'antd';
import B from 'bluebird';
import styles from './Inspector.css';
import { SCREENSHOT_INTERACTION_MODE, INTERACTION_MODE } from './shared';
import { withTranslation } from '../../util';

const {TAP, SELECT, SWIPE} = SCREENSHOT_INTERACTION_MODE;
const TYPES = {firstPointerDown: 'filled', firstPointerUp: 'newDashed', pointerDown: 'whole', pointerUp: 'dashed'};
const POINTER_TYPE = {pointerUp: 'pointerUp', pointerDown: 'pointerDown', pause: 'pause', pointerMove: 'pointerMove'};

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

    if (screenshotInteractionMode === TAP) {
      applyClientMethod({
        methodName: TAP,
        args: [
          {
            'finger1': [
              {type: 'pointerMove', duration: 0, x, y},
              {type: 'pointerDown', button: 0},
              {type: 'pause', duration: 100},
              {type: 'pointerUp', button: 0}
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
    await applyClientMethod({
      methodName: SWIPE,
      args: {'finger1': [
        {type: 'pointerMove', duration: 0, x: swipeStart.x, y: swipeStart.y},
        {type: 'pointerDown', button: 0},
        {type: 'pointerMove', duration: 750, origin: 'viewport', x: swipeEnd.x, y: swipeEnd.y},
        {type: 'pointerUp', button: 0}
      ]},
    });
    clearSwipeAction();
  }

  // retrieve and format gesture for svg drawings
  getGestureCoordinates () {
    const {pointerUp, pointerDown, pause, pointerMove} = POINTER_TYPE;
    const {showGesture} = this.props;
    if (showGesture) {
      return showGesture.map((pointer) => {
        // 'type' is used to keep track of the last pointerup/pointerdown move
        let type = TYPES.pointerUp;
        const temp = [];
        for (const tick of pointer.ticks) {
          if (tick.type !== pause) {
            const len = temp.length;
            type = tick.type !== pointerMove ? TYPES[tick.type] : type;
            if (tick.type === pointerMove && tick.x && tick.y) {
              temp.push({id: tick.id, type, x: tick.x, y: tick.y, color: pointer.color});
            }
            if (len === 0) {
              if (tick.type === pointerDown) {
                temp.push({id: tick.id, type: TYPES.firstPointerDown, x: 0, y: 0, color: pointer.color});
              }
            } else {
              if (tick.type === pointerDown && temp[len - 1].type === TYPES.pointerUp) {
                temp[len - 1].type = TYPES.firstPointerDown;
              }
              if (tick.type === pointerUp && temp[len - 1].type === TYPES.pointerDown) {
                temp[len - 1].type = TYPES.firstPointerUp;
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
          {x !== null && <div className={styles.coordinatesContainer}>
            <p>{t('xCoordinate', {x})}</p>
            <p>{t('yCoordinate', {y})}</p>
          </div>}
          {swipeInstructions && <Tooltip visible={true} placement="top" title={swipeInstructions}>{screenImg}</Tooltip>}
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
                    style={tick.type === TYPES.firstPointerDown ?
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
