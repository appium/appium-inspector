import {IconQuestionMark} from '@tabler/icons-react';
import {Steps} from 'antd';

import {POINTER_TYPES} from '../../../../constants/gestures.js';
import styles from './GestureEditor.module.css';
import TimelineTickIcon from './TimelineTickIcon.jsx';

const {FILLER} = POINTER_TYPES;

const TIMELINE_ICON_SIZE = 18;

// Reformats the gesture for the timeline by adding 'filler' ticks
// so that all pointers have the same length, ensuring consistency
const updateGestureForTimeline = (pointers) => {
  const copiedPointers = structuredClone(pointers);
  const allTickLengths = copiedPointers.map((pointer) => pointer.ticks.length);
  const maxTickLength = Math.max(...allTickLengths);
  return copiedPointers.map((pointer) => {
    const currentLength = pointer.ticks.length;
    if (currentLength > 0 && currentLength < maxTickLength) {
      const fillers = Array.from({length: maxTickLength - currentLength}, () => ({
        type: FILLER,
      }));
      pointer.ticks.push(...fillers);
    }
    return pointer;
  });
};

/**
 * The gesture timeline shown in the gesture editor.
 */
const GestureEditorTimeline = ({coordType, pointers}) => {
  const timelinePointers = updateGestureForTimeline(pointers);

  const timelineItems = (ticks) =>
    ticks.map((tick) =>
      tick.type !== FILLER
        ? {
            status: 'finish',
            icon: <TimelineTickIcon tick={tick} coordType={coordType} />,
          }
        : {
            status: 'wait',
            icon: <IconQuestionMark size={TIMELINE_ICON_SIZE} />,
          },
    );

  return timelinePointers.map((pointer) => (
    <center key={pointer.id}>
      <Steps
        className={styles.gestureTimeline}
        style={{'--timelineColor': pointer.color}}
        items={timelineItems(pointer.ticks)}
      />
    </center>
  ));
};

export default GestureEditorTimeline;
