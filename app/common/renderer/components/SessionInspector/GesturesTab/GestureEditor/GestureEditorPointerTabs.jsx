import {IconFocus2, IconPlus, IconX} from '@tabler/icons-react';
import {Button, Card, Col, Input, Row, Select, Space, Tabs, Tooltip} from 'antd';
import _ from 'lodash';
import {useState} from 'react';
import {useTranslation} from 'react-i18next';

import {TABLE_TAB} from '../../../../constants/antd-types.js';
import {
  CURSOR,
  POINTER_COLORS,
  POINTER_DOWN_BTNS,
  POINTER_TYPES,
  POINTER_TYPES_MAP,
  TICK_PROPS,
} from '../../../../constants/gestures.js';
import inspectorStyles from '../../SessionInspector.module.css';
import styles from './GestureEditor.module.css';

const {POINTER_UP, POINTER_DOWN, PAUSE, POINTER_MOVE} = POINTER_TYPES;

/**
 * Tab switcher in the gesture editor,
 * where each tab is a separate pointer in the gesture
 */
const GestureEditorPointerTabs = ({
  pointers,
  setPointers,
  selectedTick,
  selectTick,
  unselectTick,
  getDefaultMoveDuration,
}) => {
  const {t} = useTranslation();

  const [activePointerId, setActivePointerId] = useState('1');

  const addPointer = () => {
    const key = pointers.length + 1;
    const pointerId = String(key);
    const copiedPointers = _.cloneDeep(pointers);
    copiedPointers.push({
      name: `pointer${key}`,
      ticks: [{id: `${key}.1`}],
      id: pointerId,
      color: POINTER_COLORS[key - 1],
    });
    setPointers(copiedPointers);
    setActivePointerId(pointerId);
  };

  const deletePointer = (targetKey) => {
    // 'newActivePointerId' variable keeps track of the previous pointer before deleting the current one
    // its default is the first pointer
    let newActivePointerId = '1';
    const pointersExceptCurrent = pointers.filter((pointer) => pointer.id !== targetKey);
    const newPointers = pointersExceptCurrent.map((pointer, index) => {
      const id = String(index + 1);
      if (id !== pointer.id) {
        pointer.id = id;
        pointer.color = POINTER_COLORS[index];
        pointer.ticks = pointer.ticks.map((tick) => {
          tick.id = `${id}.${tick.id[2]}`;
          return tick;
        });
      } else {
        newActivePointerId = pointer.id;
      }
      return pointer;
    });
    unselectTick();
    setPointers(newPointers);
    setActivePointerId(newActivePointerId);
  };

  const addTick = (pointerKey) => {
    const copiedPointers = _.cloneDeep(pointers);
    const currentPointer = copiedPointers.find((pointer) => pointer.id === pointerKey);
    const id = `${pointerKey}.${currentPointer.ticks.length + 1}`;
    currentPointer.ticks.push({id});
    setPointers(copiedPointers);
  };

  const deleteTick = (pointerKey, tickKey) => {
    const copiedPointers = _.cloneDeep(pointers);
    const currentPointer = copiedPointers.find((pointer) => pointer.id === pointerKey);
    const ticksToKeep = currentPointer.ticks.filter((tick) => tick.id !== tickKey);
    const newTicks = ticksToKeep.map((tick, index) => {
      const id = String(index + 1);
      if (tick.id !== id) {
        tick.id = `${tick.id[0]}.${id}`;
      }
      return tick;
    });
    currentPointer.ticks = newTicks;
    unselectTick();
    setPointers(copiedPointers);
  };

  // Updates the current tick within local state
  const updateTick = (tick, msg, value) => {
    const copiedPointers = _.cloneDeep(pointers);
    const currentPointer = copiedPointers.find((p) => p.id === tick.id[0]);
    const targetTickIdx = currentPointer.ticks.findIndex((t) => t.id === tick.id);
    // currentTick can be assigned a new tick object if made changes to pointer types
    let currentTick = currentPointer.ticks[targetTickIdx];

    // We create an entire new tick for changes in pointer types to ensure previous properties are removed
    if (msg === TICK_PROPS.POINTER_TYPE) {
      if (value === POINTER_MOVE) {
        selectTick(tick.id);
      }
      currentTick = {
        id: tick.id,
        type: value,
        ...([POINTER_DOWN, POINTER_UP].includes(value) && {button: POINTER_DOWN_BTNS.LEFT}),
        ...(value === PAUSE && {duration: 0}),
      };
    } else {
      // We just modify the existing tick values
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
    }

    currentPointer.ticks[targetTickIdx] = currentTick;
    setPointers(copiedPointers);
  };

  const updatePointerName = (pointerName, pointerIndex) => {
    const copiedPointers = _.cloneDeep(pointers);
    copiedPointers[pointerIndex].name = pointerName;
    setPointers(copiedPointers);
  };

  const tickButton = (tick) => (
    <center>
      <Space.Compact block>
        <Button
          block
          type={tick.button === POINTER_DOWN_BTNS.LEFT ? 'primary' : 'default'}
          onClick={() => updateTick(tick, TICK_PROPS.BUTTON, POINTER_DOWN_BTNS.LEFT)}
        >
          {t('Left')}
        </Button>
        <Button
          block
          type={tick.button === POINTER_DOWN_BTNS.RIGHT ? 'primary' : 'default'}
          onClick={() => updateTick(tick, TICK_PROPS.BUTTON, POINTER_DOWN_BTNS.RIGHT)}
        >
          {t('Right')}
        </Button>
      </Space.Compact>
    </center>
  );

  const tickDuration = (tick) => (
    <center>
      <Space.Compact block>
        <Input
          className={styles.tickInputBox}
          value={!isNaN(tick.duration) ? tick.duration : null}
          placeholder={t('Duration')}
          defaultValue={tick.duration}
          onChange={(e) => updateTick(tick, TICK_PROPS.DURATION, e.target.value)}
        />
        <Space.Addon>ms</Space.Addon>
      </Space.Compact>
    </center>
  );

  const tickCoords = (tick) => (
    <center>
      <Space.Compact block>
        <Input
          className={styles.tickInputBox}
          value={!isNaN(tick.x) ? tick.x : ''}
          placeholder="X"
          defaultValue={tick.x}
          onChange={(e) => updateTick(tick, TICK_PROPS.X, e.target.value)}
        />
        <Input
          className={styles.tickInputBox}
          value={!isNaN(tick.y) ? tick.y : ''}
          placeholder="Y"
          defaultValue={tick.y}
          onChange={(e) => updateTick(tick, TICK_PROPS.Y, e.target.value)}
        />
      </Space.Compact>
    </center>
  );

  const tickType = (tick) => (
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
        onChange={(e) => updateTick(tick, TICK_PROPS.POINTER_TYPE, e)}
        options={[
          {value: POINTER_MOVE, label: t(POINTER_TYPES_MAP.pointerMove)},
          {value: POINTER_DOWN, label: t(POINTER_TYPES_MAP.pointerDown)},
          {value: POINTER_UP, label: t(POINTER_TYPES_MAP.pointerUp)},
          {value: PAUSE, label: t(POINTER_TYPES_MAP.pause)},
        ]}
      />
    </center>
  );

  const tapCoordinatesBtn = (tickId) => (
    <Tooltip title={t('toggleMoveActionCoordPicker')}>
      <Button
        size="small"
        type={selectedTick === tickId ? 'primary' : 'text'}
        icon={<IconFocus2 size={18} />}
        onClick={() => (selectedTick === tickId ? unselectTick() : selectTick(tickId))}
      />
    </Tooltip>
  );

  const tickCard = (tick) => (
    <Card
      hoverable={true}
      className={styles.tickCard}
      extra={
        <>
          {tick.type === POINTER_MOVE && tapCoordinatesBtn(tick.id)}
          <Tooltip title={t('Delete')}>
            <Button
              size="small"
              type="text"
              icon={<IconX size={18} />}
              onClick={() => deleteTick(tick.id[0], tick.id)}
            />
          </Tooltip>
        </>
      }
    >
      <Space className={inspectorStyles.spaceContainer} orientation="vertical" size="middle">
        {tickType(tick)}
        {(tick.type === POINTER_MOVE || tick.type === PAUSE) && tickDuration(tick)}
        {(tick.type === POINTER_DOWN || tick.type === POINTER_UP) && tickButton(tick)}
        {tick.type === POINTER_MOVE && tickCoords(tick)}
      </Space>
    </Card>
  );

  const pointerTicksGrid = (pointer) => (
    <Row gutter={[24, 24]}>
      {pointer.ticks.map((tick) => (
        <Col xs={12} sm={12} md={12} lg={8} xl={6} xxl={4} xxxl={3} key={tick.id}>
          {tickCard(tick)}
        </Col>
      ))}
      <Col xs={12} sm={12} md={12} lg={8} xl={6} xxl={4} xxxl={3}>
        <div className={styles.tickPlusBtnWrapper}>
          <Tooltip title={t('Add')}>
            <Button icon={<IconPlus size={18} />} onClick={() => addTick(pointer.id)} />
          </Tooltip>
        </div>
      </Col>
    </Row>
  );

  const pointerTabs = pointers.map((pointer, index) => ({
    label: (
      <Tooltip title={t('Edit')}>
        <Input
          className={styles.pointerTitle}
          style={{
            cursor: activePointerId === pointer.id ? CURSOR.TEXT : CURSOR.POINTER,
            textDecorationColor: pointer.color,
          }}
          value={pointer.name}
          defaultValue={pointer.name}
          variant="borderless"
          maxLength={10}
          onChange={(e) => updatePointerName(e.target.value, index)}
        />
      </Tooltip>
    ),
    key: pointer.id,
    closable: pointer.id !== '1',
    children: pointerTicksGrid(pointer),
  }));

  return (
    <Tabs
      type="editable-card"
      onChange={(pointerId) => setActivePointerId(pointerId)}
      activeKey={activePointerId}
      onEdit={(targetKey, action) =>
        action === TABLE_TAB.ADD ? addPointer() : deletePointer(targetKey)
      }
      hideAdd={pointers.length === 5}
      centered={true}
      tabBarGutter={10}
      items={pointerTabs}
    />
  );
};

export default GestureEditorPointerTabs;
