import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import { Tabs, Input, Button, Card, Select, Row, Col, notification,
         PageHeader, Space, Steps, Divider, Tooltip, Popover } from 'antd';
import { PlayCircleOutlined, PlusCircleOutlined,
         CloseOutlined, AimOutlined, RightCircleOutlined,
         DownCircleOutlined, UpCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';
import { SCREENSHOT_INTERACTION_MODE, POINTER_TYPES,
         percentageToPixels, pixelsToPercentage } from './shared';
import InspectorCSS from './Inspector.css';

const { POINTER_UP, POINTER_DOWN, PAUSE, POINTER_MOVE } = POINTER_TYPES;

const DEFAULT_DURATION_TIME = 2500;
const COLORS = ['#FF3333', '#FF8F00', '#B65FF4', '#6CFF00', '#00FFDC'];
const BUTTONS = {LEFT: 0, RIGHT: 1};
const ACTION_TYPES = {ADD: 'add', REMOVE: 'remove'};
const MSG_TYPES = {ERROR: 'error', SUCCESS: 'success'};
const COORD_TYPE = {PERCENTAGES: 'percentages', PIXELS: 'pixels'};
const TICK_PROPS = {POINTER_TYPE: 'pointerType', DURATION: 'duration', BUTTON: 'button', X: 'x', Y: 'y'};
const CURSOR = {POINTER: 'pointer', TEXT: 'text'};
const STATUS = {WAIT: 'wait', FINISH: 'finish', COLOR: '#FFFFFF', FILLER: 'filler'};
const DISPLAY = {[POINTER_UP]: 'Pointer Up', [POINTER_DOWN]: 'Pointer Down',
                 [PAUSE]: 'Pause', [POINTER_MOVE]: 'Move'};

const DEFAULT_POINTERS = () => [{
  name: 'pointer1',
  ticks: [{id: '1.1'}],
  color: COLORS[0],
  id: '1',
}];

/**
 * Shows the gesture editor interface
 */
const GestureEditor = (props) => {
  const { loadedGesture, saveGesture, tickCoordinates, selectedTick, selectTick, unselectTick, windowSize, t } = props;
  const { PERCENTAGES, PIXELS } = COORD_TYPE;

  const [pointers, setPointers] = useState(loadedGesture ? loadedGesture.actions : DEFAULT_POINTERS());
  const [name, setName] = useState(loadedGesture ? loadedGesture.name : t('Untitled Gesture'));
  const [description, setDescription] = useState(loadedGesture ? loadedGesture.description : t('Add Description'));
  const [coordType, setCoordType] = useState(COORD_TYPE.PERCENTAGES);
  const [activePointerId, setActivePointerId] = useState('1');

  // Draw gesture whenever pointers change
  useEffect(() => {
    const { displayGesture } = props;
    const convertedPointers = getConvertedPointers(COORD_TYPE.PIXELS);
    displayGesture(convertedPointers);
  }, [pointers]);

  // Retrieve coordinates when user taps screenshot
  useEffect(() => {
    if (tickCoordinates) {
      updateCoordinates(selectedTick, tickCoordinates.x, tickCoordinates.y);
    }
  }, [selectedTick, tickCoordinates]);

  const onSave = () => {
    const { id, date } = loadedGesture;
    if (duplicatePointerNames(pointers)) { return null; }
    const gesture = {name, description, id, date, actions: getConvertedPointers(COORD_TYPE.PERCENTAGES)};
    saveGesture(gesture);
    displayNotificationMsg(MSG_TYPES.SUCCESS, t('Gesture saved'));
  };

  const onSaveAs = () => {
    if (duplicatePointerNames(pointers)) { return null; }
    const gesture = {name, description, actions: getConvertedPointers(COORD_TYPE.PERCENTAGES)};
    saveGesture(gesture);
    displayNotificationMsg(MSG_TYPES.SUCCESS, t('Gesture saved as', {gestureName: name}));
  };

  const onPlay = () => {
    const { applyClientMethod } = props;
    if (duplicatePointerNames(pointers)) { return null; }
    const formattedPointers = getW3CPointers();
    applyClientMethod({methodName: SCREENSHOT_INTERACTION_MODE.GESTURE, args: [formattedPointers]});
  };

  const onBack = () => {
    const { hideGestureEditor, removeLoadedGesture, removeGestureDisplay } = props;
    unselectTick();
    removeGestureDisplay();
    removeLoadedGesture();
    hideGestureEditor();
  };

  // Check if pointer names are duplicates before saving/playing
  const duplicatePointerNames = (localPointers) => {
    const duplicates = {};
    for (const pointer of localPointers) {
      if (duplicates[pointer.name]) {
        displayNotificationMsg(MSG_TYPES.ERROR, t('Duplicate pointer names are not allowed'));
        return true;
      } else {
        duplicates[pointer.name] = pointer;
      }
    }
    return false;
  };

  const displayNotificationMsg = (type, msg) => {
    notification[type]({
      message: msg,
      duration: 5,
    });
  };

  // Change gesture datastructure to fit Webdriver spec
  const getW3CPointers = () => {
    const newPointers = {};
    const currentPointers = getConvertedPointers(COORD_TYPE.PIXELS);
    for (const pointer of currentPointers) {
      newPointers[pointer.name] = pointer.ticks.map((tick) => _.omit(tick, 'id'));
    }
    return newPointers;
  };

  // This converts all the coordinates in the gesture to px/%
  const getConvertedPointers = (type) => {
    const { width, height } = windowSize;
    if (type === coordType) { return pointers; }
    const newPointers = _.cloneDeep(pointers);
    for (const pointer of newPointers) {
      for (const tick of pointer.ticks) {
        if (tick.type === POINTER_TYPES.POINTER_MOVE) {
          if (type === COORD_TYPE.PIXELS) {
            tick.x = percentageToPixels(tick.x, width);
            tick.y = percentageToPixels(tick.y, height);
          } else {
            tick.x = pixelsToPercentage(tick.x, width);
            tick.y = pixelsToPercentage(tick.y, height);
          }
        }
      }
    }
    return newPointers;
  };

  const getDefaultMoveDuration = (ticks, tickId, x2, y2, coordFromTap) => {
    const { width, height } = windowSize;
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
    if (coordType === COORD_TYPE.PERCENTAGES) {
      obj.x1 = percentageToPixels(obj.x1, width);
      obj.y1 = percentageToPixels(obj.y1, height);
      // No need to convert coordinates from tap since they are in px
      if (!coordFromTap) {
        obj.x2 = percentageToPixels(obj.x2, width);
        obj.y2 = percentageToPixels(obj.y2, height);
      }
    }
    const calcLength = (v1, v2) => Math.sqrt((v1 ** 2) + (v2 ** 2));
    const calcDiff = (v1, v2) => Math.abs(v2) - Math.abs(v1);
    const xDiff = calcDiff(obj.x1, obj.x2);
    const yDiff = calcDiff(obj.y1, obj.y2);
    const maxScreenLength = calcLength(width, height);
    const lineLength = calcLength(xDiff, yDiff);
    const lineLengthPct = lineLength / maxScreenLength;
    return Math.round(lineLengthPct * DEFAULT_DURATION_TIME);
  };

  // Update tapped coordinates within local state
  const updateCoordinates = (tickKey, updateX, updateY) => {
    if (!updateX || !updateY) { return null; }
    const { width, height } = windowSize;
    const copiedPointers = _.cloneDeep(pointers);
    const currentPointer = copiedPointers.find((pointer) => pointer.id === tickKey[0]);
    const currentTick = currentPointer.ticks.find((tick) => tick.id === tickKey);
    const x = parseFloat(updateX, 10);
    const y = parseFloat(updateY, 10);
    if (coordType === COORD_TYPE.PERCENTAGES) {
      currentTick.x = pixelsToPercentage(x, width);
      currentTick.y = pixelsToPercentage(y, height);
    } else {
      currentTick.x = x;
      currentTick.y = y;
    }

    if (currentTick.duration === undefined) {
      currentTick.duration = getDefaultMoveDuration(currentPointer.ticks, currentTick.id, x, y, true);
    }
    setPointers(copiedPointers);
  };

  const addPointer = () => {
    const key = pointers.length + 1;
    const pointerId = String(key);
    const copiedPointers = _.cloneDeep(pointers);
    copiedPointers.push({
      name: `pointer${key}`,
      ticks: [{id: `${key}.1`}],
      id: pointerId,
      color: COLORS[key - 1]
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
        pointer.color = COLORS[index];
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
    const id = `${pointerKey}.${(currentPointer.ticks).length + 1}`;
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
      currentTick = {id: tick.id, type: value,
                     ...([POINTER_DOWN, POINTER_UP].includes(value) && {button: BUTTONS.LEFT}),
                     ...(value === PAUSE && {duration: 0})};
    } else {
      // We just modify the existing tick values
      currentTick[msg] = parseFloat(value, 10);

      // set default duration for if not set already
      if (currentTick.x !== undefined && currentTick.y !== undefined && currentTick.duration === undefined) {
        currentTick.duration = getDefaultMoveDuration(currentPointer.ticks, tick.id, currentTick.x, currentTick.y, false);
      }
    }

    currentPointer.ticks[targetTickIdx] = currentTick;
    setPointers(copiedPointers);
  };

  // Reformats the gesture only for the timeline by populating the 'filler' ticks for each pointer
  // to match same length to keep timeline lengths consistent and accurate
  const updateGestureForTimeline = () => {
    const copiedPointers = _.cloneDeep(pointers);
    const allTickLengths = copiedPointers.map((pointer) => pointer.ticks.length);
    const maxTickLength = Math.max(...allTickLengths);
    return copiedPointers.map((pointer) => {
      const currentLength = pointer.ticks.length;
      if (currentLength > 0) {
        pointer.ticks[currentLength - 1].customStep = STATUS.WAIT;
        if (currentLength < maxTickLength) {
          const fillers = Array.from({length: maxTickLength - currentLength},
            () => ({type: STATUS.FILLER, color: STATUS.COLOR}));
          pointer.ticks.push(...fillers);
        }
      }
      return pointer;
    });
  };

  const updatePointerName = (pointerName, pointerIndex) => {
    const copiedPointers = _.cloneDeep(pointers);
    copiedPointers[pointerIndex].name = pointerName;
    setPointers(copiedPointers);
  };

  const headerTitle =
    <Tooltip key='editTitle' placement='topLeft' title={t('Edit')}>
      <Input
        defaultValue={name}
        className={InspectorCSS['gesture-header-title']}
        onChange={(e) => setName(e.target.value)}
        key={name}
        size='small' />
    </Tooltip>;

  const headerButtons = [
    <Button.Group key='coordTypes'>
      <Button
        key={PERCENTAGES}
        className={InspectorCSS['gesture-header-coord-btn']}
        type={coordType === PERCENTAGES ? 'primary' : 'default'}
        onClick={() => { setPointers(getConvertedPointers(PERCENTAGES)); setCoordType(PERCENTAGES); }}
        size='small'>%</Button>
      <Button
        key={PIXELS}
        className={InspectorCSS['gesture-header-coord-btn']}
        type={coordType === PIXELS ? 'primary' : 'default'}
        onClick={() => { setPointers(getConvertedPointers(PIXELS)); setCoordType(PIXELS); }}
        size='small'>px</Button>
    </Button.Group>,
    <Tooltip key='playGesture' title={t('Play')}>
      <Button key='play' type='primary' icon={<PlayCircleOutlined/>} onClick={() => onPlay()} />
    </Tooltip>,
    <Button key='saveAs' onClick={() => onSaveAs()}>{t('saveAs')}</Button>,
    <Button key='save' onClick={() => onSave()} disabled={!loadedGesture}>{t('Save')}</Button>
  ];

  const headerDescription =
    <Tooltip key='editDescription' placement='topLeft' title={t('Edit')}>
      <Input
        key={description}
        defaultValue={description}
        className={InspectorCSS['gesture-header-description']}
        onChange={(e) => setDescription(e.target.value)}
        size='small' />
    </Tooltip>;

  const regularTimelineIcon = (pointer, tick) => {
    const { type, duration, button, x, y } = tick;
    const iconStyle = {color: pointer.color};
    return (
      <Popover placement='bottom'
        title={<center key={tick.id}>{t(DISPLAY[type])}</center>}
        content={
          <div className={InspectorCSS['timeline-tick-title']}>
            {duration !== undefined && <p>{t('Duration')}: {duration}ms</p>}
            {button !== undefined && <p>{t('Button')}: {button === BUTTONS.LEFT ? t('Left') : t('Right')}</p>}
            {x !== undefined && <p>X: {x}{coordType === PIXELS ? 'px' : '%'}</p>}
            {y !== undefined && <p>Y: {y}{coordType === PIXELS ? 'px' : '%'}</p>}
          </div>
        }>
        {type === POINTER_MOVE && <RightCircleOutlined key={tick.id} className={InspectorCSS['gesture-header-icon']} style={iconStyle}/>}
        {type === POINTER_DOWN && <DownCircleOutlined key={tick.id} className={InspectorCSS['gesture-header-icon']} style={iconStyle}/>}
        {type === POINTER_UP && <UpCircleOutlined key={tick.id} className={InspectorCSS['gesture-header-icon']} style={iconStyle}/>}
        {type === PAUSE && <PauseCircleOutlined key={tick.id} className={InspectorCSS['gesture-header-icon']} style={iconStyle}/>}
      </Popover>
    );
  };

  const timeline = updateGestureForTimeline().map((pointer) =>
    <center key={pointer.id}>
      <Steps key={pointer.id} className={InspectorCSS['gesture-header-timeline']}
        style={{'--timelineColor': pointer.color}}
        items={pointer.ticks.map((tick) => {
          if (tick.type !== STATUS.FILLER) {
            return {key: 'timeline-steps', status: tick.customStep || STATUS.FINISH, icon: regularTimelineIcon(pointer, tick)};
          } else {
            return {key: 'transparent-steps', status: STATUS.WAIT, icon:
              <RightCircleOutlined className={InspectorCSS['gesture-header-icon']} style={{color: tick.color}}/>
            };
          }
        })} />
    </center>);

  const tickButton = (tick) =>
    <center>
      <Button.Group className={InspectorCSS['tick-button-group']}>
        <Button
          key={`${tick.id}.left`}
          type={tick.button === BUTTONS.LEFT ? 'primary' : 'default'}
          className={InspectorCSS['tick-button-input']}
          onClick={() => updateTick(tick, TICK_PROPS.BUTTON, BUTTONS.LEFT)}>
          {t('Left')}
        </Button>
        <Button
          key={`${tick.id}.right`}
          type={tick.button === BUTTONS.RIGHT ? 'primary' : 'default'}
          className={InspectorCSS['tick-button-input']}
          onClick={() => updateTick(tick, TICK_PROPS.BUTTON, BUTTONS.RIGHT)}>
          {t('Right')}
        </Button>
      </Button.Group>
    </center>;

  const tickDuration = (tick) =>
    <center>
      <Input
        key={`${tick.id}.duration`}
        className={InspectorCSS['tick-input-box']}
        value={!isNaN(tick.duration) ? tick.duration : null}
        placeholder={t('Duration')}
        defaultValue={tick.duration}
        onChange={(e) => updateTick(tick, TICK_PROPS.DURATION, e.target.value)}
        addonAfter='ms' />
    </center>;

  const tickCoords = (tick) =>
    <center>
      <div className={InspectorCSS['tick-input-box']}>
        <Input
          key={`${tick.id}.x`}
          className={InspectorCSS['tick-coord-box']}
          value={!isNaN(tick.x) ? tick.x : ''}
          placeholder='X'
          defaultValue={tick.x}
          onChange={(e) => updateTick(tick, TICK_PROPS.X, e.target.value)} />
        <Input
          key={`${tick.id}.y`}
          className={InspectorCSS['tick-coord-box']}
          value={!isNaN(tick.y) ? tick.y : ''}
          placeholder='Y'
          defaultValue={tick.y}
          onChange={(e) => updateTick(tick, TICK_PROPS.Y, e.target.value)} />
      </div>
    </center>;

  const tickType = (tick) =>
    <center>
      <Select
        key={`${tick.id}.pointerType`}
        className={InspectorCSS['tick-pointer-input']}
        placeholder='Pointer Type'
        value={tick.type}
        defaultValue={tick.type}
        size='middle'
        dropdownMatchSelectWidth={false}
        onChange={(e) => updateTick(tick, TICK_PROPS.POINTER_TYPE, e)}>
        <Select.Option className={InspectorCSS['option-inpt']} value={POINTER_MOVE} key={`${tick.id}.${POINTER_MOVE}`}>
          {t(DISPLAY.pointerMove)}
        </Select.Option>
        <Select.Option className={InspectorCSS['option-inpt']} value={POINTER_DOWN} key={`${tick.id}.${POINTER_DOWN}`}>
          {t(DISPLAY.pointerDown)}
        </Select.Option>
        <Select.Option className={InspectorCSS['option-inpt']} value={POINTER_UP} key={`${tick.id}.${POINTER_UP}`}>
          {t(DISPLAY.pointerUp)}
        </Select.Option>
        <Select.Option className={InspectorCSS['option-inpt']} value={PAUSE} key={`${tick.id}.${PAUSE}`}>
          {t(DISPLAY.pause)}
        </Select.Option>
      </Select>
    </center>;

  const tapCoordinatesBtn = (tickId) =>
    <Tooltip title={selectedTick === tickId ? t('Click to Set Coordinates') : t('Set Coordinates Via Field')}>
      <Button
        key={`${tickId}.tap`}
        size='small'
        type={selectedTick === tickId ? 'primary' : 'text'}
        icon={<AimOutlined/>}
        onClick={() => selectedTick === tickId ? unselectTick() : selectTick(tickId)} />
    </Tooltip>;

  const tickCard = (tick) =>
    <Card
      hoverable={true}
      key={tick.id}
      className={InspectorCSS['tick-card']}
      extra={
        <>
          {tick.type === POINTER_MOVE && tapCoordinatesBtn(tick.id)}
          <Button size='small' type='text' icon={<CloseOutlined />} key={`${tick.id}.remove`}
            onClick={() => deleteTick(tick.id[0], tick.id)} />
        </>
      }>
      <Space className={InspectorCSS.spaceContainer} direction='vertical' size='middle'>
        {tickType(tick)}
        {(tick.type === POINTER_MOVE || tick.type === PAUSE) && tickDuration(tick)}
        {(tick.type === POINTER_DOWN || tick.type === POINTER_UP) && tickButton(tick)}
        {tick.type === POINTER_MOVE && tickCoords(tick)}
      </Space>
    </Card>;

  const pointerTicksGrid = (pointer) =>
    <Row gutter={[24, 24]}>
      {pointer.ticks.map((tick) =>
        <Col xs={12} sm={12} md={12} lg={8} xl={6} xxl={4} key={`${tick.id}.col1`}>
          {tickCard(tick)}
        </Col>
      )}
      <Col xs={12} sm={12} md={12} lg={8} xl={6} xxl={4} key={`${pointer.id}.col1`}>
        <Card className={InspectorCSS['tick-plus-card']} bordered={false}>
          <center>
            <Button className={InspectorCSS['tick-plus-btn']} icon={<PlusCircleOutlined/>}
              onClick={() => addTick(pointer.id)} key={ACTION_TYPES.ADD} />
          </center>
        </Card>
      </Col>
    </Row>;

  const pointerTabs = pointers.map((pointer, index) =>
    ({
      label: <Tooltip title={t('Edit')}>
        <Input
          key={pointer.id}
          className={InspectorCSS['pointer-title']}
          style={{ cursor: activePointerId === pointer.id ? CURSOR.TEXT : CURSOR.POINTER, textDecorationColor: pointer.color}}
          value={pointer.name}
          defaultValue={pointer.name}
          bordered={false}
          maxLength={10}
          onChange={(e) => updatePointerName(e.target.value, index)} />
      </Tooltip>,
      key: pointer.id,
      children: pointerTicksGrid(pointer)
    })
  );

  return (
    <>
      <PageHeader
        className={InspectorCSS['gesture-header']}
        onBack={() => onBack()}
        title={headerTitle}
        extra={headerButtons}
        footer={
          <>
            {headerDescription}
            <Divider/>
            {timeline}
          </>
        } />
      <Tabs
        type='editable-card'
        onChange={(pointerId) => setActivePointerId(pointerId)}
        activeKey={activePointerId}
        onEdit={(targetKey, action) => action === ACTION_TYPES.ADD ? addPointer() : deletePointer(targetKey)}
        hideAdd={pointers.length === 5}
        centered={true}
        tabBarGutter={10}
        items={pointerTabs} />
    </>
  );
};

export default GestureEditor;
