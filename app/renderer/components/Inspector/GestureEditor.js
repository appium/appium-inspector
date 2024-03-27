import {
  AimOutlined,
  CloseOutlined,
  DownCircleOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  PlusCircleOutlined,
  QuestionCircleOutlined,
  RightCircleOutlined,
  UpCircleOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Divider,
  Input,
  PageHeader,
  Popover,
  Row,
  Select,
  Space,
  Steps,
  Tabs,
  Tooltip,
  notification,
} from 'antd';
import _ from 'lodash';
import React, {useEffect, useState} from 'react';

import {NOTIF, TABLE_TAB} from '../../constants/antd-types';
import {
  CURSOR,
  DEFAULT_POINTER,
  FILLER_TICK,
  POINTER_COLORS,
  POINTER_DOWN_BTNS,
  POINTER_MOVE_COORDS_TYPE,
  POINTER_MOVE_DEFAULT_DURATION,
  POINTER_TYPES,
  POINTER_TYPES_MAP,
  TICK_PROPS,
} from '../../constants/gestures';
import {SCREENSHOT_INTERACTION_MODE} from '../../constants/screenshot';
import {percentageToPixels, pixelsToPercentage} from '../../utils/other';
import InspectorCSS from './Inspector.css';

const {POINTER_UP, POINTER_DOWN, PAUSE, POINTER_MOVE} = POINTER_TYPES;

/**
 * Shows the gesture editor interface
 */
const GestureEditor = (props) => {
  const {
    loadedGesture,
    saveGesture,
    tickCoordinates,
    selectedTick,
    selectTick,
    unselectTick,
    windowSize,
    t,
  } = props;

  const [pointers, setPointers] = useState(loadedGesture ? loadedGesture.actions : DEFAULT_POINTER);
  const [name, setName] = useState(loadedGesture ? loadedGesture.name : t('Untitled Gesture'));
  const [description, setDescription] = useState(
    loadedGesture ? loadedGesture.description : t('Add Description'),
  );
  const [coordType, setCoordType] = useState(POINTER_MOVE_COORDS_TYPE.PERCENTAGES);
  const [activePointerId, setActivePointerId] = useState('1');

  // Draw gesture whenever pointers change
  useEffect(() => {
    const {displayGesture} = props;
    const convertedPointers = getConvertedPointers(POINTER_MOVE_COORDS_TYPE.PIXELS);
    displayGesture(convertedPointers);
  }, [pointers]);

  // Retrieve coordinates when user taps screenshot
  useEffect(() => {
    if (tickCoordinates) {
      updateCoordinates(selectedTick, tickCoordinates.x, tickCoordinates.y);
    }
  }, [selectedTick, tickCoordinates]);

  const onSave = () => {
    const {id, date} = loadedGesture;
    if (duplicatePointerNames(pointers)) {
      return null;
    }
    const gesture = {
      name,
      description,
      id,
      date,
      actions: getConvertedPointers(POINTER_MOVE_COORDS_TYPE.PERCENTAGES),
    };
    saveGesture(gesture);
    displayNotificationMsg(NOTIF.SUCCESS, t('Gesture saved'));
  };

  const onSaveAs = () => {
    if (duplicatePointerNames(pointers)) {
      return null;
    }
    const gesture = {
      name,
      description,
      actions: getConvertedPointers(POINTER_MOVE_COORDS_TYPE.PERCENTAGES),
    };
    saveGesture(gesture);
    displayNotificationMsg(NOTIF.SUCCESS, t('Gesture saved as', {gestureName: name}));
    onBack();
  };

  const onPlay = () => {
    const {applyClientMethod} = props;
    if (duplicatePointerNames(pointers)) {
      return null;
    }
    const formattedPointers = getW3CPointers();
    applyClientMethod({methodName: SCREENSHOT_INTERACTION_MODE.GESTURE, args: [formattedPointers]});
  };

  const onBack = () => {
    const {hideGestureEditor, removeLoadedGesture, removeGestureDisplay} = props;
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
        displayNotificationMsg(NOTIF.ERROR, t('Duplicate pointer names are not allowed'));
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
    const currentPointers = getConvertedPointers(POINTER_MOVE_COORDS_TYPE.PIXELS);
    for (const pointer of currentPointers) {
      newPointers[pointer.name] = pointer.ticks.map((tick) => _.omit(tick, 'id'));
    }
    return newPointers;
  };

  // This converts all the coordinates in the gesture to px/%
  const getConvertedPointers = (type) => {
    const {width, height} = windowSize;
    if (type === coordType) {
      return pointers;
    }
    const newPointers = _.cloneDeep(pointers);
    for (const pointer of newPointers) {
      for (const tick of pointer.ticks) {
        if (tick.type === POINTER_TYPES.POINTER_MOVE) {
          if (type === POINTER_MOVE_COORDS_TYPE.PIXELS) {
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
  };

  // Update tapped coordinates within local state
  const updateCoordinates = (tickKey, updateX, updateY) => {
    if (!updateX || !updateY) {
      return null;
    }
    const {width, height} = windowSize;
    const copiedPointers = _.cloneDeep(pointers);
    const currentPointer = copiedPointers.find((pointer) => pointer.id === tickKey[0]);
    const currentTick = currentPointer.ticks.find((tick) => tick.id === tickKey);
    const x = parseFloat(updateX, 10);
    const y = parseFloat(updateY, 10);
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
  };

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
      currentTick[msg] = parseFloat(value, 10);

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

  // Reformats the gesture only for the timeline by populating the 'filler' ticks for each pointer
  // to match same length to keep timeline lengths consistent and accurate
  const updateGestureForTimeline = () => {
    const copiedPointers = _.cloneDeep(pointers);
    const allTickLengths = copiedPointers.map((pointer) => pointer.ticks.length);
    const maxTickLength = Math.max(...allTickLengths);
    return copiedPointers.map((pointer) => {
      const currentLength = pointer.ticks.length;
      if (currentLength > 0) {
        pointer.ticks[currentLength - 1].customStep = FILLER_TICK.WAIT;
        if (currentLength < maxTickLength) {
          const fillers = Array.from({length: maxTickLength - currentLength}, () => ({
            type: FILLER_TICK.TYPE,
            color: FILLER_TICK.COLOR,
          }));
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

  const headerTitle = (
    <Tooltip title={t('Edit')}>
      <Input
        defaultValue={name}
        className={InspectorCSS['gesture-header-title']}
        onChange={(e) => setName(e.target.value)}
        size="small"
      />
    </Tooltip>
  );

  const headerButtons = (
    <>
      <Button.Group>
        <Button
          className={InspectorCSS['gesture-header-coord-btn']}
          type={coordType === POINTER_MOVE_COORDS_TYPE.PERCENTAGES ? 'primary' : 'default'}
          onClick={() => {
            setPointers(getConvertedPointers(POINTER_MOVE_COORDS_TYPE.PERCENTAGES));
            setCoordType(POINTER_MOVE_COORDS_TYPE.PERCENTAGES);
          }}
          size="small"
        >
          %
        </Button>
        <Button
          className={InspectorCSS['gesture-header-coord-btn']}
          type={coordType === POINTER_MOVE_COORDS_TYPE.PIXELS ? 'primary' : 'default'}
          onClick={() => {
            setPointers(getConvertedPointers(POINTER_MOVE_COORDS_TYPE.PIXELS));
            setCoordType(POINTER_MOVE_COORDS_TYPE.PIXELS);
          }}
          size="small"
        >
          px
        </Button>
      </Button.Group>
      <Tooltip title={t('Play')}>
        <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => onPlay()} />
      </Tooltip>
      <Button onClick={() => onSaveAs()}>{t('saveAs')}</Button>
      <Button onClick={() => onSave()} disabled={!loadedGesture}>
        {t('Save')}
      </Button>
    </>
  );

  const headerDescription = (
    <Tooltip title={t('Edit')}>
      <Input
        defaultValue={description}
        className={InspectorCSS['gesture-header-description']}
        onChange={(e) => setDescription(e.target.value)}
        size="small"
      />
    </Tooltip>
  );

  const regularTimelineIcon = (pointer, tick) => {
    const {type, duration, button, x, y} = tick;
    const iconStyle = {color: pointer.color};
    return (
      <Popover
        placement="bottom"
        title={<center>{t(POINTER_TYPES_MAP[type])}</center>}
        content={
          <div className={InspectorCSS['timeline-tick-title']}>
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
        {type === POINTER_MOVE && (
          <RightCircleOutlined className={InspectorCSS['gesture-header-icon']} style={iconStyle} />
        )}
        {type === POINTER_DOWN && (
          <DownCircleOutlined className={InspectorCSS['gesture-header-icon']} style={iconStyle} />
        )}
        {type === POINTER_UP && (
          <UpCircleOutlined className={InspectorCSS['gesture-header-icon']} style={iconStyle} />
        )}
        {type === PAUSE && (
          <PauseCircleOutlined className={InspectorCSS['gesture-header-icon']} style={iconStyle} />
        )}
        {type === undefined && (
          <QuestionCircleOutlined
            className={InspectorCSS['gesture-header-icon']}
            style={iconStyle}
          />
        )}
      </Popover>
    );
  };

  const timeline = updateGestureForTimeline().map((pointer) => (
    <center key={pointer.id}>
      <Steps
        className={InspectorCSS['gesture-header-timeline']}
        style={{'--timelineColor': pointer.color}}
        items={pointer.ticks.map((tick) => {
          if (tick.type !== FILLER_TICK.TYPE) {
            return {
              key: 'timeline-steps',
              status: tick.customStep || FILLER_TICK.FINISH,
              icon: regularTimelineIcon(pointer, tick),
            };
          } else {
            return {
              key: 'transparent-steps',
              status: FILLER_TICK.WAIT,
              icon: (
                <RightCircleOutlined
                  className={InspectorCSS['gesture-header-icon']}
                  style={{color: tick.color}}
                />
              ),
            };
          }
        })}
      />
    </center>
  ));

  const tickButton = (tick) => (
    <center>
      <Button.Group className={InspectorCSS['tick-button-group']}>
        <Button
          type={tick.button === POINTER_DOWN_BTNS.LEFT ? 'primary' : 'default'}
          className={InspectorCSS['tick-button-input']}
          onClick={() => updateTick(tick, TICK_PROPS.BUTTON, POINTER_DOWN_BTNS.LEFT)}
        >
          {t('Left')}
        </Button>
        <Button
          type={tick.button === POINTER_DOWN_BTNS.RIGHT ? 'primary' : 'default'}
          className={InspectorCSS['tick-button-input']}
          onClick={() => updateTick(tick, TICK_PROPS.BUTTON, POINTER_DOWN_BTNS.RIGHT)}
        >
          {t('Right')}
        </Button>
      </Button.Group>
    </center>
  );

  const tickDuration = (tick) => (
    <center>
      <Input
        className={InspectorCSS['tick-input-box']}
        value={!isNaN(tick.duration) ? tick.duration : null}
        placeholder={t('Duration')}
        defaultValue={tick.duration}
        onChange={(e) => updateTick(tick, TICK_PROPS.DURATION, e.target.value)}
        addonAfter="ms"
      />
    </center>
  );

  const tickCoords = (tick) => (
    <center>
      <div className={InspectorCSS['tick-input-box']}>
        <Input
          className={InspectorCSS['tick-coord-box']}
          value={!isNaN(tick.x) ? tick.x : ''}
          placeholder="X"
          defaultValue={tick.x}
          onChange={(e) => updateTick(tick, TICK_PROPS.X, e.target.value)}
        />
        <Input
          className={InspectorCSS['tick-coord-box']}
          value={!isNaN(tick.y) ? tick.y : ''}
          placeholder="Y"
          defaultValue={tick.y}
          onChange={(e) => updateTick(tick, TICK_PROPS.Y, e.target.value)}
        />
      </div>
    </center>
  );

  const tickType = (tick) => (
    <center>
      <Select
        className={InspectorCSS['tick-pointer-input']}
        placeholder={t('Action Type')}
        value={tick.type}
        defaultValue={tick.type}
        size="middle"
        dropdownMatchSelectWidth={false}
        onChange={(e) => updateTick(tick, TICK_PROPS.POINTER_TYPE, e)}
      >
        <Select.Option className={InspectorCSS['option-inpt']} value={POINTER_MOVE}>
          {t(POINTER_TYPES_MAP.pointerMove)}
        </Select.Option>
        <Select.Option className={InspectorCSS['option-inpt']} value={POINTER_DOWN}>
          {t(POINTER_TYPES_MAP.pointerDown)}
        </Select.Option>
        <Select.Option className={InspectorCSS['option-inpt']} value={POINTER_UP}>
          {t(POINTER_TYPES_MAP.pointerUp)}
        </Select.Option>
        <Select.Option className={InspectorCSS['option-inpt']} value={PAUSE}>
          {t(POINTER_TYPES_MAP.pause)}
        </Select.Option>
      </Select>
    </center>
  );

  const tapCoordinatesBtn = (tickId) => (
    <Tooltip
      title={
        selectedTick === tickId ? t('Click to Set Coordinates') : t('Set Coordinates Via Field')
      }
    >
      <Button
        size="small"
        type={selectedTick === tickId ? 'primary' : 'text'}
        icon={<AimOutlined />}
        onClick={() => (selectedTick === tickId ? unselectTick() : selectTick(tickId))}
      />
    </Tooltip>
  );

  const tickCard = (tick) => (
    <Card
      hoverable={true}
      className={InspectorCSS['tick-card']}
      extra={
        <>
          {tick.type === POINTER_MOVE && tapCoordinatesBtn(tick.id)}
          <Button
            size="small"
            type="text"
            icon={<CloseOutlined />}
            onClick={() => deleteTick(tick.id[0], tick.id)}
          />
        </>
      }
    >
      <Space className={InspectorCSS.spaceContainer} direction="vertical" size="middle">
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
        <Col xs={12} sm={12} md={12} lg={8} xl={6} xxl={4} key={tick.id}>
          {tickCard(tick)}
        </Col>
      ))}
      <Col xs={12} sm={12} md={12} lg={8} xl={6} xxl={4}>
        <Card className={InspectorCSS['tick-plus-card']} bordered={false}>
          <center>
            <Button
              className={InspectorCSS['tick-plus-btn']}
              icon={<PlusCircleOutlined />}
              onClick={() => addTick(pointer.id)}
            />
          </center>
        </Card>
      </Col>
    </Row>
  );

  const pointerTabs = pointers.map((pointer, index) => ({
    label: (
      <Tooltip title={t('Edit')}>
        <Input
          className={InspectorCSS['pointer-title']}
          style={{
            cursor: activePointerId === pointer.id ? CURSOR.TEXT : CURSOR.POINTER,
            textDecorationColor: pointer.color,
          }}
          value={pointer.name}
          defaultValue={pointer.name}
          bordered={false}
          maxLength={10}
          onChange={(e) => updatePointerName(e.target.value, index)}
        />
      </Tooltip>
    ),
    key: pointer.id,
    children: pointerTicksGrid(pointer),
  }));

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
            <Divider />
            {timeline}
          </>
        }
      />
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
    </>
  );
};

export default GestureEditor;
