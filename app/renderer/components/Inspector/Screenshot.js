import React, { Component } from 'react';
import HighlighterRects from './HighlighterRects';
import { Spin, Tooltip } from 'antd';
import B from 'bluebird';
import styles from './Inspector.css';
import { SCREENSHOT_INTERACTION_MODE } from './shared';
import { withTranslation } from '../../util';

const {TAP, SELECT, SWIPE, GESTURE} = SCREENSHOT_INTERACTION_MODE;

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
           swipeStart, swipeEnd, setSwipeStart, setSwipeEnd} = this.props;
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

  generateGestureCoordinates () {
    const { gestureToDraw } = this.props;

    if (!gestureToDraw) {
      return null;
    }

    const { actions } = gestureToDraw;

    const pointers = [];

    const colors = ['#FF3333', '#FF8F00', '#FFFF00', '#6CFF00', '#00FFDC'];

    for (const key of Object.keys(actions)) {
      const temp = {start: [], interim: [], end: [], color: colors.pop()};
      for (const action of actions[key]) {
        if (action.type === 'pointerMove') {
          const coordinate = [parseInt(action.x, 10), parseInt(action.y, 10)];
          if (temp.interim.length === 0) {
            temp.start = coordinate;
            temp.interim.push(coordinate);
          } else {
            temp.interim.push(coordinate);
          }
        }
      }
      if (temp.interim.length === 0) {
        return null;
      }
      const len = temp.interim.length - 1;
      temp.end = temp.interim[len];
      pointers.push(temp);
    }
    return pointers;
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
    } = this.props;
    const {x, y} = this.state;

    // If we're tapping or swiping, show the 'crosshair' cursor style
    const screenshotStyle = {};
    if ([TAP, SWIPE, GESTURE].includes(screenshotInteractionMode)) {
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

    const points = this.generateGestureCoordinates();

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
          {screenshotInteractionMode === GESTURE && points &&
            <svg className={styles.swipeSvg}>
              {
                points.map((pointer) =>
                  <>
                    {pointer.interim.map((_, index) => index > 0 ?
                      <><line
                        x1={pointer.interim[index - 1][0] / scaleRatio}
                        y1={pointer.interim[index - 1][1] / scaleRatio}
                        x2={pointer.interim[index][0] / scaleRatio}
                        y2={pointer.interim[index][1] / scaleRatio}
                        style={{ stroke: pointer.color }} />
                      {pointer.interim[index - 1] !== pointer.start ? <circle cx={pointer.interim[index - 1][0] / scaleRatio} cy={pointer.interim[index - 1][1] / scaleRatio} style={{ fill: pointer.color }} /> : <></>}
                      </>
                      :
                      <></>)}
                    <circle cx={pointer.start[0] / scaleRatio} cy={pointer.start[1] / scaleRatio} style={{stroke: pointer.color}}/>
                    <circle cx={pointer.end[0] / scaleRatio} cy={pointer.end[1] / scaleRatio} style={{stroke: pointer.color, strokeDasharray: '0.9%', borderStyle: 'dashed'}}/>
                  </>)
              }
            </svg>
          }
        </div>
      </div>
    </Spin>;
  }
}

export default withTranslation(Screenshot);
