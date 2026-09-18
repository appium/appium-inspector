import {IconQuestionMark} from '@tabler/icons-react';
import {Steps} from 'antd';

import {POINTER_TYPES} from '../../../../constants/gestures.js';
import TimelineTickIcon from './TimelineTickIcon.jsx';

import styles from './GestureEditor.module.css';

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

  return (
    <div style={{width: '100%', display: 'flex', flexDirection: 'column', overflowX: 'scroll'}}>
      <div style={{padding: '0px 20px', minWidth: '300px'}}>
        {timelinePointers.map((pointer) => (
          <Steps
            key={pointer.id}
            className={styles.gestureTimeline}
            style={{'--timelineColor': pointer.color}}
            size="small"
            responsive={false}
            items={timelineItems(pointer.ticks)}
          />
        ))}
      </div>
    </div>
  );
};

export default GestureEditorTimeline;
