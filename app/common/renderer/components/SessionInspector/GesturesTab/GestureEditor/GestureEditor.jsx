import {Divider} from 'antd';
import _ from 'lodash';
import {useCallback, useEffect, useState} from 'react';

import {
  DEFAULT_POINTER,
  POINTER_MOVE_COORDS_TYPE,
  POINTER_MOVE_DEFAULT_DURATION,
  POINTER_TYPES,
} from '../../../../constants/gestures.js';
import {percentageToPixels, pixelsToPercentage} from '../../../../utils/other.js';
import styles from './GestureEditor.module.css';
import GestureEditorCard from './GestureEditorCard.jsx';
import GestureEditorHeader from './GestureEditorHeader.jsx';
import GestureEditorPointerTabs from './GestureEditorPointerTabs.jsx';
import GestureEditorTimeline from './GestureEditorTimeline.jsx';

const {POINTER_MOVE} = POINTER_TYPES;

/**
 * Shows the gesture editor interface
 */
const GestureEditor = (props) => {
  const {loadedGesture, tickCoordinates, selectedTick, selectTick, unselectTick, windowSize} =
    props;

  const [pointers, setPointers] = useState(loadedGesture?.actions ?? DEFAULT_POINTER);
  const [coordType, setCoordType] = useState(POINTER_MOVE_COORDS_TYPE.PERCENTAGES);

  const getDefaultMoveDuration = useCallback(
    (ticks, tickId, x2, y2, coordFromTap) => {
      const {width, height} = windowSize;
      const ticksExceptCurrent = ticks.filter((tick) => tick.id !== tickId);
      const prevPointerMoves = [];
      for (const tick of ticksExceptCurrent) {
        if (tick.type === POINTER_MOVE && tick.x !== undefined && tick.y !== undefined) {
          prevPointerMoves.push({x: tick.x, y: tick.y});
        }
      }
      const len = prevPointerMoves.length;
      if (len === 0) {
        return 0;
      }
      const obj = {x1: prevPointerMoves[len - 1].x, y1: prevPointerMoves[len - 1].y, x2, y2};
      if (coordType === POINTER_MOVE_COORDS_TYPE.PERCENTAGES) {
        obj.x1 = percentageToPixels(obj.x1, width);
        obj.y1 = percentageToPixels(obj.y1, height);
        // No need to convert coordinates from tap since they are in px
        if (!coordFromTap) {
          obj.x2 = percentageToPixels(obj.x2, width);
          obj.y2 = percentageToPixels(obj.y2, height);
        }
      }
      const calcLength = (v1, v2) => Math.sqrt(v1 ** 2 + v2 ** 2);
      const calcDiff = (v1, v2) => Math.abs(v2) - Math.abs(v1);
      const xDiff = calcDiff(obj.x1, obj.x2);
      const yDiff = calcDiff(obj.y1, obj.y2);
      const maxScreenLength = calcLength(width, height);
      const lineLength = calcLength(xDiff, yDiff);
      const lineLengthPct = lineLength / maxScreenLength;
      return Math.round(lineLengthPct * POINTER_MOVE_DEFAULT_DURATION);
    },
    [coordType, windowSize],
  );

  // Update tapped coordinates within local state
  const updateCoordinates = useCallback(
    (tickKey, updateX, updateY) => {
      if (!updateX || !updateY) {
        return null;
      }
      const {width, height} = windowSize;
      const copiedPointers = _.cloneDeep(pointers);
      const currentPointer = copiedPointers.find((pointer) => pointer.id === tickKey[0]);
      const currentTick = currentPointer.ticks.find((tick) => tick.id === tickKey);
      const x = parseFloat(updateX);
      const y = parseFloat(updateY);
      if (coordType === POINTER_MOVE_COORDS_TYPE.PERCENTAGES) {
        currentTick.x = pixelsToPercentage(x, width);
        currentTick.y = pixelsToPercentage(y, height);
      } else {
        currentTick.x = x;
        currentTick.y = y;
      }

      if (currentTick.duration === undefined) {
        currentTick.duration = getDefaultMoveDuration(
          currentPointer.ticks,
          currentTick.id,
          x,
          y,
          true,
        );
      }
      setPointers(copiedPointers);
    },
    [coordType, getDefaultMoveDuration, pointers, windowSize],
  );

  // Retrieve coordinates when user taps screenshot
  // Defer state updates to the next animation frame to avoid synchronous setState in effect
  useEffect(() => {
    if (!tickCoordinates || !selectedTick) {
      return;
    }
    let rafId = requestAnimationFrame(() => {
      updateCoordinates(selectedTick, tickCoordinates.x, tickCoordinates.y);
    });
    return () => cancelAnimationFrame(rafId);
  }, [selectedTick, tickCoordinates, updateCoordinates]);

  return (
    <GestureEditorCard>
      <GestureEditorHeader
        {...props}
        pointers={pointers}
        setPointers={setPointers}
        coordType={coordType}
        setCoordType={setCoordType}
      />
      <Divider className={styles.gestureEditorDivider} />
      <GestureEditorTimeline coordType={coordType} pointers={pointers} />
      <Divider className={styles.gestureEditorDivider} />
      <GestureEditorPointerTabs
        pointers={pointers}
        setPointers={setPointers}
        selectedTick={selectedTick}
        selectTick={selectTick}
        unselectTick={unselectTick}
        getDefaultMoveDuration={getDefaultMoveDuration}
      />
    </GestureEditorCard>
  );
};

export default GestureEditor;
