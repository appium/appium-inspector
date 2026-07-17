import {
  IconArrowBigDownLine,
  IconArrowBigRightLines,
  IconArrowBigUpLine,
  IconPlayerPause,
  IconQuestionMark,
} from '@tabler/icons-react';
import {Popover, Steps} from 'antd';
import _ from 'lodash';
import {useTranslation} from 'react-i18next';

import {
  POINTER_DOWN_BTNS,
  POINTER_MOVE_COORDS_TYPE,
  POINTER_TYPES,
  POINTER_TYPES_MAP,
} from '../../../../constants/gestures.js';
import styles from './GestureEditor.module.css';

const {POINTER_UP, POINTER_DOWN, PAUSE, POINTER_MOVE, FILLER} = POINTER_TYPES;

/**
 * The gesture timeline shown in the gesture editor.
 */
const GestureEditorTimeline = ({coordType, pointers}) => {
  const {t} = useTranslation();

  // Reformats the gesture only for the timeline by populating the 'filler' ticks for each pointer
  // to match same length to keep timeline lengths consistent and accurate
  const updateGestureForTimeline = () => {
    const copiedPointers = _.cloneDeep(pointers);
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

  const regularTimelineIcon = (tick) => {
    const {type, duration, button, x, y} = tick;
    return (
      <Popover
        placement="bottom"
        title={<center>{t(POINTER_TYPES_MAP[type])}</center>}
        content={
          <div className={styles.timelineTickTitle}>
            {duration !== undefined && (
              <p>
                {t('Duration')}: {duration}ms
              </p>
            )}
            {button !== undefined && (
              <p>
                {t('Button')}: {button === POINTER_DOWN_BTNS.LEFT ? t('Left') : t('Right')}
              </p>
            )}
            {x !== undefined && (
              <p>
                X: {x}
                {coordType === POINTER_MOVE_COORDS_TYPE.PIXELS ? 'px' : '%'}
              </p>
            )}
            {y !== undefined && (
              <p>
                Y: {y}
                {coordType === POINTER_MOVE_COORDS_TYPE.PIXELS ? 'px' : '%'}
              </p>
            )}
            {type === undefined && <p>{t('Action Type Not Defined')}</p>}
          </div>
        }
      >
        {type === POINTER_MOVE && <IconArrowBigRightLines size={18} />}
        {type === POINTER_DOWN && <IconArrowBigDownLine size={18} />}
        {type === POINTER_UP && <IconArrowBigUpLine size={18} />}
        {type === PAUSE && <IconPlayerPause size={18} />}
        {type === undefined && <IconQuestionMark size={18} />}
      </Popover>
    );
  };

  return updateGestureForTimeline().map((pointer) => (
    <center key={pointer.id}>
      <Steps
        className={styles.gestureTimeline}
        style={{'--timelineColor': pointer.color}}
        items={pointer.ticks.map((tick) =>
          tick.type !== FILLER
            ? {
                status: 'finish',
                icon: regularTimelineIcon(tick),
              }
            : {
                status: 'wait',
                icon: <IconQuestionMark size={18} />,
              },
        )}
      />
    </center>
  ));
};

export default GestureEditorTimeline;
