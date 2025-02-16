import {Spin} from 'antd';
import {Fragment, useRef, useState} from 'react';

import {GESTURE_ITEM_STYLES, POINTER_TYPES} from '../../constants/gestures';
import {DEFAULT_SWIPE, DEFAULT_TAP, SCREENSHOT_INTERACTION_MODE} from '../../constants/screenshot';
import {INSPECTOR_TABS} from '../../constants/session-inspector';
import HighlighterRects from './HighlighterRects.jsx';
import styles from './Inspector.module.css';

const {POINTER_UP, POINTER_DOWN, PAUSE, POINTER_MOVE} = POINTER_TYPES;
const {TAP, SELECT, SWIPE, TAP_SWIPE} = SCREENSHOT_INTERACTION_MODE;

/**
 * Shows screenshot of running application and divs that highlight the elements' bounding boxes
 */
const Screenshot = (props) => {
  const {
    screenshot,
    serverDetails,
    isUsingMjpegMode,
    methodCallInProgress,
    screenshotInteractionMode,
    coordStart,
    coordEnd,
    clearCoordAction,
    scaleRatio,
    selectedTick,
    selectedInspectorTab,
    applyClientMethod,
    t,
  } = props;

  const containerEl = useRef();
  const [x, setX] = useState();
  const [y, setY] = useState();

  const handleScreenshotClick = async () => {
    const {tapTickCoordinates} = props;
    if (selectedTick) {
      await tapTickCoordinates(x, y);
    }
  };

  const handleScreenshotDown = async () => {
    const {setCoordStart} = props;
    if (screenshotInteractionMode === TAP_SWIPE) {
      await setCoordStart(x, y);
    }
  };

  const handleScreenshotUp = async () => {
    const {setCoordEnd} = props;
    if (screenshotInteractionMode === TAP_SWIPE) {
      await setCoordEnd(x, y);
      if (Math.abs(coordStart.x - x) < 5 && Math.abs(coordStart.y - y) < 5) {
        await handleDoTap({x, y}); // Pass coordEnd because otherwise it is not retrieved
      } else {
        await handleDoSwipe({x, y}); // Pass coordEnd because otherwise it is not retrieved
      }
      await clearCoordAction();
    }
  };

  const handleDoTap = async (tapLocal) => {
    const {POINTER_NAME, DURATION_1, DURATION_2, BUTTON} = DEFAULT_TAP;
    await applyClientMethod({
      methodName: TAP,
      args: [
        {
          [POINTER_NAME]: [
            {type: POINTER_MOVE, duration: DURATION_1, x: tapLocal.x, y: tapLocal.y},
            {type: POINTER_DOWN, button: BUTTON},
            {type: PAUSE, duration: DURATION_2},
            {type: POINTER_UP, button: BUTTON},
          ],
        },
      ],
    });
  };

  const handleDoSwipe = async (swipeEndLocal) => {
    const {POINTER_NAME, DURATION_1, DURATION_2, BUTTON, ORIGIN} = DEFAULT_SWIPE;
    await applyClientMethod({
      methodName: SWIPE,
      args: {
        [POINTER_NAME]: [
          {type: POINTER_MOVE, duration: DURATION_1, x: coordStart.x, y: coordStart.y},
          {type: POINTER_DOWN, button: BUTTON},
          {
            type: POINTER_MOVE,
            duration: DURATION_2,
            origin: ORIGIN,
            x: swipeEndLocal.x,
            y: swipeEndLocal.y,
          },
          {type: POINTER_UP, button: BUTTON},
        ],
      },
    });
  };

  const handleScreenshotCoordsUpdate = (e) => {
    if (screenshotInteractionMode !== SELECT) {
      const offsetX = e.nativeEvent.offsetX;
      const offsetY = e.nativeEvent.offsetY;
      const newX = offsetX * scaleRatio;
      const newY = offsetY * scaleRatio;
      setX(Math.round(newX));
      setY(Math.round(newY));
    }
  };

  const handleScreenshotLeave = async () => {
    setX(null);
    setY(null);
    await clearCoordAction();
  };

  // retrieve and format gesture for svg drawings
  const getGestureCoordinates = () => {
    const {showGesture} = props;
    const {FILLED, NEW_DASHED, WHOLE, DASHED} = GESTURE_ITEM_STYLES;
    const defaultTypes = {pointerDown: WHOLE, pointerUp: DASHED};

    if (!showGesture) {
      return null;
    }
    return showGesture.map((pointer) => {
      // 'type' is used to keep track of the last pointerup/pointerdown move
      let type = DASHED;
      const temp = [];
      for (const tick of pointer.ticks) {
        if (tick.type === PAUSE) {
          continue;
        }
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
  if (screenshotInteractionMode === TAP_SWIPE || selectedTick) {
    screenshotStyle.cursor = 'crosshair';
  }

  const screenSrc = serverDetails.mjpegScreenshotUrl || `data:image/gif;base64,${screenshot}`;
  const screenImg = <img src={screenSrc} id="screenshot" />;
  const points = getGestureCoordinates();

  // Show the screenshot and highlighter rects.
  // Show loading indicator if a method call is in progress, unless using MJPEG mode.
  return (
    <Spin size="large" spinning={!!methodCallInProgress && !isUsingMjpegMode}>
      <div className={styles.innerScreenshotContainer}>
        <div
          ref={containerEl}
          style={screenshotStyle}
          onMouseDown={handleScreenshotDown}
          onMouseUp={handleScreenshotUp}
          onMouseMove={handleScreenshotCoordsUpdate}
          onMouseOver={handleScreenshotCoordsUpdate}
          onMouseLeave={handleScreenshotLeave}
          onClick={handleScreenshotClick}
          className={styles.screenshotBox}
        >
          {screenshotInteractionMode !== SELECT && (
            <div className={styles.coordinatesContainer}>
              <p>{t('xCoordinate', {x})}</p>
              <p>{t('yCoordinate', {y})}</p>
            </div>
          )}
          {screenImg}
          {screenshotInteractionMode === SELECT && containerEl.current && (
            <HighlighterRects {...props} containerEl={containerEl.current} />
          )}
          {screenshotInteractionMode === TAP_SWIPE && (
            <svg className={styles.swipeSvg}>
              {coordStart && (
                <circle cx={coordStart.x / scaleRatio} cy={coordStart.y / scaleRatio} />
              )}
              {coordStart && !coordEnd && (
                <line
                  x1={coordStart.x / scaleRatio}
                  y1={coordStart.y / scaleRatio}
                  x2={x / scaleRatio}
                  y2={y / scaleRatio}
                />
              )}
              {coordStart && coordEnd && (
                <line
                  x1={coordStart.x / scaleRatio}
                  y1={coordStart.y / scaleRatio}
                  x2={coordEnd.x / scaleRatio}
                  y2={coordEnd.y / scaleRatio}
                />
              )}
            </svg>
          )}
          {selectedInspectorTab === INSPECTOR_TABS.GESTURES && points && (
            <svg key="gestureSVG" className={styles.gestureSvg}>
              {points.map((pointer) =>
                pointer.map((tick, index) => (
                  <Fragment key={tick.id}>
                    {index > 0 && (
                      <line
                        className={styles[tick.type]}
                        key={`${tick.id}.line`}
                        x1={pointer[index - 1].x / scaleRatio}
                        y1={pointer[index - 1].y / scaleRatio}
                        x2={tick.x / scaleRatio}
                        y2={tick.y / scaleRatio}
                        style={{stroke: tick.color}}
                      />
                    )}
                    <circle
                      className={styles[`circle-${tick.type}`]}
                      key={`${tick.id}.circle`}
                      cx={tick.x / scaleRatio}
                      cy={tick.y / scaleRatio}
                      style={
                        tick.type === GESTURE_ITEM_STYLES.FILLED
                          ? {fill: tick.color}
                          : {stroke: tick.color}
                      }
                    />
                  </Fragment>
                )),
              )}
            </svg>
          )}
        </div>
      </div>
    </Spin>
  );
};

export default Screenshot;
