import {Button, Input, Select, Space} from 'antd';
import {useTranslation} from 'react-i18next';

import {
  POINTER_DOWN_BTNS,
  POINTER_TYPES,
  POINTER_TYPES_MAP,
  TICK_PROPS,
} from '../../../../constants/gestures.js';
import inspectorStyles from '../../SessionInspector.module.css';
import styles from './GestureEditor.module.css';

const {POINTER_UP, POINTER_DOWN, PAUSE, POINTER_MOVE} = POINTER_TYPES;

// Updates the current tick type by creating a new tick,
// to ensure previous properties are removed
const updateTickType = (tick, value, selectTick, pointers, setPointers) => {
  const copiedPointers = structuredClone(pointers);
  const currentPointer = copiedPointers.find((p) => p.id === tick.id[0]);
  const targetTickIdx = currentPointer.ticks.findIndex((t) => t.id === tick.id);

  if (value === POINTER_MOVE) {
    selectTick(tick.id);
  }
  const currentTick = {
    id: tick.id,
    type: value,
    ...([POINTER_DOWN, POINTER_UP].includes(value) && {button: POINTER_DOWN_BTNS.LEFT}),
    ...(value === PAUSE && {duration: 0}),
  };

  currentPointer.ticks[targetTickIdx] = currentTick;
  setPointers(copiedPointers);
};

// Updates the current tick values
const updateTickValues = (tick, msg, value, getDefaultMoveDuration, pointers, setPointers) => {
  const copiedPointers = structuredClone(pointers);
  const currentPointer = copiedPointers.find((p) => p.id === tick.id[0]);
  const targetTickIdx = currentPointer.ticks.findIndex((t) => t.id === tick.id);
  const currentTick = currentPointer.ticks[targetTickIdx];
  currentTick[msg] = parseFloat(value);

  // set default duration for if not set already
  if (
    currentTick.x !== undefined &&
    currentTick.y !== undefined &&
    currentTick.duration === undefined
  ) {
    currentTick.duration = getDefaultMoveDuration(
      currentPointer.ticks,
      tick.id,
      currentTick.x,
      currentTick.y,
      false,
    );
  }

  currentPointer.ticks[targetTickIdx] = currentTick;
  setPointers(copiedPointers);
};

/**
 * The type selector for a tick.
 */
const TickTypeSelector = ({tick, selectTick, pointers, setPointers}) => {
  const {t} = useTranslation();
  return (
    <center>
      <Select
        styles={{
          root: {width: '100%'},
          content: {justifyContent: 'center'},
          popup: {listItem: {textAlign: 'center'}},
        }}
        placeholder={t('Action Type')}
        value={tick.type}
        defaultValue={tick.type}
        size="middle"
        popupMatchSelectWidth={false}
        onChange={(e) => updateTickType(tick, e, selectTick, pointers, setPointers)}
        options={[
          {value: POINTER_MOVE, label: t(POINTER_TYPES_MAP.pointerMove)},
          {value: POINTER_DOWN, label: t(POINTER_TYPES_MAP.pointerDown)},
          {value: POINTER_UP, label: t(POINTER_TYPES_MAP.pointerUp)},
          {value: PAUSE, label: t(POINTER_TYPES_MAP.pause)},
        ]}
      />
    </center>
  );
};

/**
 * The duration input for a tick.
 */
const TickDurationInput = ({tick, getDefaultMoveDuration, pointers, setPointers}) => {
  const {t} = useTranslation();
  return (
    <center>
      <Space.Compact block>
        <Input
          className={styles.tickInputBox}
          value={!isNaN(tick.duration) ? tick.duration : null}
          placeholder={t('Duration')}
          defaultValue={tick.duration}
          onChange={(e) =>
            updateTickValues(
              tick,
              TICK_PROPS.DURATION,
              e.target.value,
              getDefaultMoveDuration,
              pointers,
              setPointers,
            )
          }
        />
        <Space.Addon>ms</Space.Addon>
      </Space.Compact>
    </center>
  );
};

/**
 * The button selector for a tick.
 */
const TickButtonSelector = ({tick, getDefaultMoveDuration, pointers, setPointers}) => {
  const {t} = useTranslation();

  return (
    <center>
      <Space.Compact block>
        <Button
          block
          type={tick.button === POINTER_DOWN_BTNS.LEFT ? 'primary' : 'default'}
          onClick={() =>
            updateTickValues(
              tick,
              TICK_PROPS.BUTTON,
              POINTER_DOWN_BTNS.LEFT,
              getDefaultMoveDuration,
              pointers,
              setPointers,
            )
          }
        >
          {t('Left')}
        </Button>
        <Button
          block
          type={tick.button === POINTER_DOWN_BTNS.RIGHT ? 'primary' : 'default'}
          onClick={() =>
            updateTickValues(
              tick,
              TICK_PROPS.BUTTON,
              POINTER_DOWN_BTNS.RIGHT,
              getDefaultMoveDuration,
              pointers,
              setPointers,
            )
          }
        >
          {t('Right')}
        </Button>
      </Space.Compact>
    </center>
  );
};

/**
 * The coordinates input field for a tick.
 */
const TickCoordsInput = ({tick, getDefaultMoveDuration, pointers, setPointers}) => (
  <center>
    <Space.Compact block>
      <Input
        className={styles.tickInputBox}
        value={!isNaN(tick.x) ? tick.x : ''}
        placeholder="X"
        defaultValue={tick.x}
        onChange={(e) =>
          updateTickValues(
            tick,
            TICK_PROPS.X,
            e.target.value,
            getDefaultMoveDuration,
            pointers,
            setPointers,
          )
        }
      />
      <Input
        className={styles.tickInputBox}
        value={!isNaN(tick.y) ? tick.y : ''}
        placeholder="Y"
        defaultValue={tick.y}
        onChange={(e) =>
          updateTickValues(
            tick,
            TICK_PROPS.Y,
            e.target.value,
            getDefaultMoveDuration,
            pointers,
            setPointers,
          )
        }
      />
    </Space.Compact>
  </center>
);

/**
 * Contents of a tick card.
 */
const GestureEditorTickCardContents = ({
  tick,
  selectTick,
  getDefaultMoveDuration,
  pointers,
  setPointers,
}) => (
  <Space className={inspectorStyles.spaceContainer} orientation="vertical" size="middle">
    <TickTypeSelector
      tick={tick}
      selectTick={selectTick}
      pointers={pointers}
      setPointers={setPointers}
    />
    {(tick.type === POINTER_MOVE || tick.type === PAUSE) && (
      <TickDurationInput
        tick={tick}
        getDefaultMoveDuration={getDefaultMoveDuration}
        pointers={pointers}
        setPointers={setPointers}
      />
    )}
    {(tick.type === POINTER_DOWN || tick.type === POINTER_UP) && (
      <TickButtonSelector
        tick={tick}
        getDefaultMoveDuration={getDefaultMoveDuration}
        pointers={pointers}
        setPointers={setPointers}
      />
    )}
    {tick.type === POINTER_MOVE && (
      <TickCoordsInput
        tick={tick}
        getDefaultMoveDuration={getDefaultMoveDuration}
        pointers={pointers}
        setPointers={setPointers}
      />
    )}
  </Space>
);

export default GestureEditorTickCardContents;
