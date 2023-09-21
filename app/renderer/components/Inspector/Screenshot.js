import React, { useRef, useState } from 'react';
import HighlighterRects from './HighlighterRects';
import { Spin, Tooltip } from 'antd';
import B from 'bluebird';
import styles from './Inspector.css';
import { SCREENSHOT_INTERACTION_MODE, INTERACTION_MODE, POINTER_TYPES,
         DEFAULT_TAP, DEFAULT_SWIPE } from './shared';

const { POINTER_UP, POINTER_DOWN, PAUSE, POINTER_MOVE } = POINTER_TYPES;
const { TAP, SELECT, SWIPE } = SCREENSHOT_INTERACTION_MODE;
const TYPES = {FILLED: 'filled', NEW_DASHED: 'newDashed', WHOLE: 'whole', DASHED: 'dashed'};

/**
 * Shows screenshot of running application and divs that highlight the elements' bounding boxes
 */
const Screenshot = (props) => {
  const { screenshot, mjpegScreenshotUrl, methodCallInProgress, screenshotInteractionMode, swipeStart, swipeEnd,
          scaleRatio, selectedTick, selectedInteractionMode, applyClientMethod, t } = props;

  const containerEl = useRef();
  const [x, setX] = useState();
  const [y, setY] = useState();

  const handleScreenshotClick = async () => {
    const { setSwipeStart, setSwipeEnd, clearSwipeAction } = props;
    const { POINTER_NAME, DURATION_1, DURATION_2, BUTTON } = DEFAULT_TAP;

  if (screenshotInteractionMode === SWIPE || screenshotInteractionMode === TAP) {
      if (!swipeStart) {
        setSwipeStart(x, y);
      } else if (!swipeEnd) {
        if (x === null || y === null) {
          setX(swipeStart.x);
          setY(swipeStart.y);
        }
        setSwipeEnd(x, y);
        if (Math.abs(swipeStart.x - x) < 10 && Math.abs(swipeStart.y - y) < 10) {
          await B.delay(500);
          await applyClientMethod({
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
          await clearSwipeAction();
        } else if (x !== null && y !== null) {
          await B.delay(500); // Wait a second to do the swipe so user can see the SVG line
          await handleDoSwipe({x, y}); // Pass swipeEnd because otherwise it is not retrieved
        }
      }
    }
  };

  const handleDoSwipe = async (swipeEndLocal) => {
    const { clearSwipeAction } = props;
    const { POINTER_NAME, DURATION_1, DURATION_2, BUTTON, ORIGIN } = DEFAULT_SWIPE;
    await applyClientMethod({
      methodName: SWIPE,
      args: {[POINTER_NAME]: [
        {type: POINTER_MOVE, duration: DURATION_1, x: swipeStart.x, y: swipeStart.y},
        {type: POINTER_DOWN, button: BUTTON},
        {type: POINTER_MOVE, duration: DURATION_2, origin: ORIGIN, x: swipeEndLocal.x, y: swipeEndLocal.y},
        {type: POINTER_UP, button: BUTTON}
      ]},
    });
    clearSwipeAction();
  };

  const handleMouseMove = (e) => {
    if (screenshotInteractionMode !== SELECT) {
      const offsetX = e.nativeEvent.offsetX;
      const offsetY = e.nativeEvent.offsetY;
      const newX = offsetX * scaleRatio;
      const newY = offsetY * scaleRatio;
      setX(Math.round(newX));
      setY(Math.round(newY));
    }
  };

  const handleMouseOut = () => {
    setX(null);
    setY(null);
  };

  // retrieve and format gesture for svg drawings
  const getGestureCoordinates = () => {
    const { showGesture } = props;
    const { FILLED, NEW_DASHED, WHOLE, DASHED } = TYPES;
    const defaultTypes = {pointerDown: WHOLE, pointerUp: DASHED};

    if (!showGesture) { return null; }
    return showGesture.map((pointer) => {
      // 'type' is used to keep track of the last pointerup/pointerdown move
      let type = DASHED;
      const temp = [];
      for (const tick of pointer.ticks) {
        if (tick.type === PAUSE) { continue; }
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
      return temp;
    });
  };

  // If we're tapping or swiping, show the 'crosshair' cursor style
  const screenshotStyle = {};
  if ([TAP, SWIPE].includes(screenshotInteractionMode) || selectedTick) {
    screenshotStyle.cursor = 'crosshair';
  }

  const screenSrc = mjpegScreenshotUrl || `data:image/gif;base64,${screenshot}`;
  const screenImg = <img src={screenSrc} id="screenshot" />;
  const points = getGestureCoordinates();

  // Show the screenshot and highlighter rects.
  // Show loading indicator if a method call is in progress, unless using MJPEG mode.
  return (
    <Spin size='large' spinning={false}>
      <div className={styles.innerScreenshotContainer}>
        <div ref={containerEl}
          style={screenshotStyle}
          onMouseDown={handleScreenshotClick}
          onMouseUp={handleScreenshotClick}
          onMouseMove={handleMouseMove}
          onMouseOut={handleMouseOut}
          className={styles.screenshotBox}>
          {screenshotInteractionMode !== SELECT && <div className={styles.coordinatesContainer}>
            <p>{t('xCoordinate', {x})}</p>
            <p>{t('yCoordinate', {y})}</p>
          </div>}
          {screenImg}
          {screenshotInteractionMode === SELECT && containerEl.current &&
            <HighlighterRects {...props} containerEl={containerEl.current} />
          }
          {screenshotInteractionMode === TAP &&
            <svg className={styles.swipeSvg}>
              {swipeStart && swipeEnd && <circle
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
          {screenshotInteractionMode === SWIPE &&
            <div className={styles.tapDiv}></div>
          }
          {selectedInteractionMode === INTERACTION_MODE.GESTURES && points &&
            <svg key='gestureSVG' className={styles.gestureSvg}>
              {points.map((pointer) =>
                pointer.map((tick, index) =>
                  <React.Fragment key={tick.id}>
                    {index > 0 && <line
                      className={styles[tick.type]}
                      key={`${tick.id}.line`}
                      x1={pointer[index - 1].x / scaleRatio}
                      y1={pointer[index - 1].y / scaleRatio}
                      x2={tick.x / scaleRatio}
                      y2={tick.y / scaleRatio}
                      style={{stroke: tick.color}} />
                    }
                    <circle
                      className={styles[`circle-${tick.type}`]}
                      key={`${tick.id}.circle`}
                      cx={tick.x / scaleRatio}
                      cy={tick.y / scaleRatio}
                      style={tick.type === TYPES.FILLED ? {fill: tick.color} : {stroke: tick.color}} />
                  </React.Fragment>
                )
              )}
            </svg>
          }
        </div>
      </div>
    </Spin>
  );
};

export default Screenshot;
