import {Spin} from 'antd';
import {useState} from 'react';

import {POINTER_TYPES} from '../../../constants/gestures.js';
import {
  DEFAULT_SWIPE,
  DEFAULT_TAP,
  SCREENSHOT_INTERACTION_MODE,
} from '../../../constants/screenshot.js';
import {INSPECTOR_TABS} from '../../../constants/session-inspector.js';
import CoordinatesContainer from './Overlays/CoordinatesContainer.jsx';
import ElementOverlays from './Overlays/ElementOverlays.jsx';
import GestureTrail from './Overlays/GestureTrail.jsx';
import TapSwipeTrail from './Overlays/TapSwipeTrail.jsx';
import styles from './Screenshot.module.css';

const {POINTER_UP, POINTER_DOWN, PAUSE, POINTER_MOVE} = POINTER_TYPES;
const {TAP, SELECT, SWIPE, TAP_SWIPE} = SCREENSHOT_INTERACTION_MODE;

const handleTapOnScreenshot = async (tapPoint, applyClientMethod) => {
  const {POINTER_NAME, DURATION_1, DURATION_2, BUTTON} = DEFAULT_TAP;
  await applyClientMethod({
    methodName: TAP,
    args: [
      {
        [POINTER_NAME]: [
          {type: POINTER_MOVE, duration: DURATION_1, x: tapPoint.x, y: tapPoint.y},
          {type: POINTER_DOWN, button: BUTTON},
          {type: PAUSE, duration: DURATION_2},
          {type: POINTER_UP, button: BUTTON},
        ],
      },
    ],
  });
};

const handleSwipeOnScreenshot = async (swipeStartPoint, swipeEndPoint, applyClientMethod) => {
  const {POINTER_NAME, DURATION_1, DURATION_2, BUTTON, ORIGIN} = DEFAULT_SWIPE;
  await applyClientMethod({
    methodName: SWIPE,
    args: {
      [POINTER_NAME]: [
        {type: POINTER_MOVE, duration: DURATION_1, x: swipeStartPoint.x, y: swipeStartPoint.y},
        {type: POINTER_DOWN, button: BUTTON},
        {
          type: POINTER_MOVE,
          duration: DURATION_2,
          origin: ORIGIN,
          x: swipeEndPoint.x,
          y: swipeEndPoint.y,
        },
        {type: POINTER_UP, button: BUTTON},
      ],
    },
  });
};

/**
 * Shows the app screenshot along with various overlay elements,
 * such as divs that highlight the elements' bounding boxes
 */
const ScreenshotImgWithOverlays = (props) => {
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
    tapTickCoordinates,
    setCoordStart,
    setCoordEnd,
    showGesture,
    selectedInspectorTab,
    applyClientMethod,
  } = props;

  const [x, setX] = useState();
  const [y, setY] = useState();

  // Used when creating a gesture and clicking on screenshot to set move coordinates
  const handleScreenshotClick = async () => {
    if (selectedTick) {
      await tapTickCoordinates(x, y);
    }
  };

  // Used during screenshot Coordinates Mode
  const handleScreenshotDown = async () => {
    if (screenshotInteractionMode === TAP_SWIPE) {
      await setCoordStart(x, y);
    }
  };

  // Used during screenshot Coordinates Mode
  const handleScreenshotUp = async () => {
    if (screenshotInteractionMode === TAP_SWIPE) {
      await setCoordEnd(x, y);
      if (Math.abs(coordStart.x - x) < 5 && Math.abs(coordStart.y - y) < 5) {
        await handleTapOnScreenshot({x, y}, applyClientMethod);
      } else {
        await handleSwipeOnScreenshot(coordStart, {x, y}, applyClientMethod);
      }
      await clearCoordAction();
    }
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

  // If we're tapping or swiping, show the 'crosshair' cursor style
  const screenshotStyle = {};
  if (screenshotInteractionMode === TAP_SWIPE || selectedTick) {
    screenshotStyle.cursor = 'crosshair';
  }

  const screenSrc = isUsingMjpegMode
    ? serverDetails.mjpegScreenshotUrl
    : `data:image/gif;base64,${screenshot}`;

  // Show loading indicator if a method call is in progress, unless using MJPEG mode.
  return (
    <Spin size="large" spinning={!!methodCallInProgress && !isUsingMjpegMode}>
      <div className={styles.innerScreenshotContainer}>
        <div
          style={screenshotStyle}
          onMouseDown={handleScreenshotDown}
          onMouseUp={handleScreenshotUp}
          onMouseMove={handleScreenshotCoordsUpdate}
          onMouseOver={handleScreenshotCoordsUpdate}
          onMouseLeave={handleScreenshotLeave}
          onClick={handleScreenshotClick}
          className={styles.screenshotBox}
        >
          {screenshotInteractionMode !== SELECT && <CoordinatesContainer x={x} y={y} />}
          <img src={screenSrc} id="screenshot" />
          {screenshotInteractionMode === SELECT && <ElementOverlays {...props} />}
          {screenshotInteractionMode === TAP_SWIPE && (
            <TapSwipeTrail
              coordStart={coordStart}
              coordEnd={coordEnd}
              x={x}
              y={y}
              scaleRatio={scaleRatio}
            />
          )}
          {selectedInspectorTab === INSPECTOR_TABS.GESTURES && showGesture && (
            <GestureTrail gesture={showGesture} scaleRatio={scaleRatio} />
          )}
        </div>
      </div>
    </Spin>
  );
};

export default ScreenshotImgWithOverlays;
