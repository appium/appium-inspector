import {Fragment} from 'react';

import {GESTURE_ITEM_STYLES, POINTER_TYPES} from '../../../../constants/gestures.js';
import styles from './Overlays.module.css';

const {POINTER_UP, POINTER_DOWN, PAUSE, POINTER_MOVE} = POINTER_TYPES;
const {FILLED, NEW_DASHED, WHOLE, DASHED} = GESTURE_ITEM_STYLES;
const defaultTypes = {pointerDown: WHOLE, pointerUp: DASHED};

// retrieve and format gesture for svg drawings
const getGestureCoordinates = (gesture) =>
  gesture.map((pointer) => {
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

/**
 * Line connecting two points in a gesture,
 * overlaid on the app screenshot.
 */
const GestureTrailPointerLine = ({tick, prevTick, scaleRatio}) => (
  <line
    className={styles[tick.type]}
    key={`${tick.id}.line`}
    x1={prevTick.x / scaleRatio}
    y1={prevTick.y / scaleRatio}
    x2={tick.x / scaleRatio}
    y2={tick.y / scaleRatio}
    style={{stroke: tick.color}}
  />
);

/**
 * Single point in a gesture, overlaid on the app screenshot.
 */
const GestureTrailPointerPoint = ({tick, scaleRatio}) => (
  <circle
    className={styles[`${tick.type}Circle`]}
    key={`${tick.id}.circle`}
    cx={tick.x / scaleRatio}
    cy={tick.y / scaleRatio}
    r={8}
    style={tick.type === GESTURE_ITEM_STYLES.FILLED ? {fill: tick.color} : {stroke: tick.color}}
  />
);

/**
 * Points and lines of a single pointer in a gesture,
 * overlaid on the app screenshot.
 */
const GestureTrailPointer = ({pointer, scaleRatio}) =>
  pointer.map((tick, index) => (
    <Fragment key={tick.id}>
      {index > 0 && (
        <GestureTrailPointerLine
          tick={tick}
          prevTick={pointer[index - 1]}
          scaleRatio={scaleRatio}
        />
      )}
      <GestureTrailPointerPoint tick={tick} scaleRatio={scaleRatio} />
    </Fragment>
  ));

/**
 * Points and lines of a gesture overlaid on the app screenshot,
 * showing positions of the currently highlighted gesture in the Gestures tab.
 */
const GestureTrail = ({gesture, scaleRatio}) => (
  <svg key="gestureSVG" className={styles.gestureSvg}>
    {getGestureCoordinates(gesture).map((pointer) => (
      <GestureTrailPointer key={pointer.id} pointer={pointer} scaleRatio={scaleRatio} />
    ))}
  </svg>
);

export default GestureTrail;
