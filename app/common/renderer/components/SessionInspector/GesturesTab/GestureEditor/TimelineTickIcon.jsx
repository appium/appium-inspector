import {
  IconArrowBigDownLine,
  IconArrowBigRightLines,
  IconArrowBigUpLine,
  IconPlayerPause,
  IconQuestionMark,
} from '@tabler/icons-react';
import {Popover} from 'antd';
import {useTranslation} from 'react-i18next';

import {
  POINTER_DOWN_BTNS,
  POINTER_MOVE_COORDS_TYPE,
  POINTER_TYPES,
  POINTER_TYPES_MAP,
} from '../../../../constants/gestures.js';
import styles from './GestureEditor.module.css';

const {POINTER_UP, POINTER_DOWN, PAUSE, POINTER_MOVE} = POINTER_TYPES;

const TIMELINE_ICON_SIZE = 18;

const coordSuffix = (coordType) => (coordType === POINTER_MOVE_COORDS_TYPE.PIXELS ? 'px' : '%');

/**
 * Label shown in the tooltip of an action that uses duration.
 */
const TickDurationLabel = ({duration}) => {
  const {t} = useTranslation();

  return (
    <p>
      {t('Duration')}: {duration}ms
    </p>
  );
};

/**
 * Label shown in the tooltip of an action that uses the X coordinate.
 */
const TickXLabel = ({tickX, coordType}) => (
  <p>
    X: {tickX}
    {coordSuffix(coordType)}
  </p>
);

/**
 * Label shown in the tooltip of an action that uses the Y coordinate.
 */
const TickYLabel = ({tickY, coordType}) => (
  <p>
    Y: {tickY}
    {coordSuffix(coordType)}
  </p>
);

/**
 * Label shown in the tooltip of an action that uses a button.
 */
const TickButtonLabel = ({button}) => {
  const {t} = useTranslation();

  return (
    <p>
      {t('Button')}: {button === POINTER_DOWN_BTNS.LEFT ? t('Left') : t('Right')}
    </p>
  );
};

/**
 * Label shown in the tooltip of an undefined action.
 */
const TickUndefinedLabel = () => {
  const {t} = useTranslation();

  return <p>{t('Action Type Not Defined')}</p>;
};

/**
 * Tooltip wrapper for a defined action in the gesture timeline.
 */
const TimelineTickIconWrapper = ({type, popoverContents, children}) => {
  const {t} = useTranslation();

  return (
    <Popover
      placement="bottom"
      title={<center>{t(POINTER_TYPES_MAP[type])}</center>}
      content={<div className={styles.timelineTickTitle}>{popoverContents}</div>}
    >
      {children}
    </Popover>
  );
};

/**
 * Icon + tooltip of a move action in the gesture timeline.
 */
const TimelineTickMoveIcon = ({tick, coordType}) => (
  <TimelineTickIconWrapper
    type={tick.type}
    popoverContents={
      <>
        <TickDurationLabel duration={tick.duration} />
        <TickXLabel tickX={tick.x} coordType={coordType} />
        <TickYLabel tickY={tick.y} coordType={coordType} />
      </>
    }
  >
    <IconArrowBigRightLines size={TIMELINE_ICON_SIZE} />
  </TimelineTickIconWrapper>
);

/**
 * Icon + tooltip of a pointer up/down action in the gesture timeline.
 */
const TimelineTickPointerIcon = ({tick}) => {
  const PointerUpDownIcon = tick.type === POINTER_DOWN ? IconArrowBigDownLine : IconArrowBigUpLine;

  return (
    <TimelineTickIconWrapper
      type={tick.type}
      popoverContents={<TickButtonLabel button={tick.button} />}
    >
      <PointerUpDownIcon size={TIMELINE_ICON_SIZE} />
    </TimelineTickIconWrapper>
  );
};

/**
 * Icon + tooltip of a pause action in the gesture timeline.
 */
const TimelineTickPauseIcon = ({tick}) => (
  <TimelineTickIconWrapper
    type={tick.type}
    popoverContents={<TickDurationLabel duration={tick.duration} />}
  >
    <IconPlayerPause size={TIMELINE_ICON_SIZE} />
  </TimelineTickIconWrapper>
);

/**
 * Icon + tooltip of an undefined action in the gesture timeline.
 */
const TimelineTickUndefinedIcon = ({tick}) => (
  <TimelineTickIconWrapper type={tick.type} popoverContents={<TickUndefinedLabel />}>
    <IconQuestionMark size={TIMELINE_ICON_SIZE} />
  </TimelineTickIconWrapper>
);

/**
 * Icon + tooltip of an action in the gesture timeline.
 */
const TimelineTickIcon = ({tick, coordType}) => {
  switch (tick.type) {
    case POINTER_MOVE:
      return <TimelineTickMoveIcon tick={tick} coordType={coordType} />;
    case POINTER_DOWN:
    case POINTER_UP:
      return <TimelineTickPointerIcon tick={tick} />;
    case PAUSE:
      return <TimelineTickPauseIcon tick={tick} />;
    default:
      return <TimelineTickUndefinedIcon tick={tick} />;
  }
};

export default TimelineTickIcon;
