import React, { Component } from 'react';
import { Tabs, Input, Button, Card, Select, Row, Col, notification,
         PageHeader, Space, Steps, Divider, Tooltip, Popover } from 'antd';
import { PlayCircleOutlined, PlusCircleOutlined,
         CloseOutlined, AimOutlined, RightCircleOutlined,
         DownCircleOutlined, UpCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';
import { withTranslation } from '../../util';
import { SCREENSHOT_INTERACTION_MODE, POINTER_TYPES,
         percentageToPixels, pixelsToPercentage } from './shared';
import InspectorCSS from './Inspector.css';

const {TabPane} = Tabs;
const {Option} = Select;
const {Step} = Steps;
const ButtonGroup = Button.Group;
const {POINTER_UP, POINTER_DOWN, PAUSE, POINTER_MOVE} = POINTER_TYPES;

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
class GestureEditor extends Component {

  constructor (props) {
    super(props);
    this.state = {
      name: this.props.loadedGesture ? this.props.loadedGesture.name : 'Untitled',
      description: this.props.loadedGesture ? this.props.loadedGesture.description : 'Add Description',
      date: this.props.loadedGesture ? this.props.loadedGesture.date : null,
      id: this.props.loadedGesture ? this.props.loadedGesture.id : null,
      pointers: this.props.loadedGesture ? this.props.loadedGesture.actions : DEFAULT_POINTERS(),
      coordType: COORD_TYPE.PERCENTAGES,
      activeKey: '1',
    };
  }

  componentDidMount () {
    this.onDraw();
  }

  // Retrieve coordinates when user taps screenshot and draw gesture whenever state changes
  componentDidUpdate (prevProps, prevState) {
    const {selectedTick, tickCoordinates} = this.props;
    if (selectedTick !== prevProps.selectedTick || tickCoordinates !== prevProps.tickCoordinates) {
      if (tickCoordinates) {
        this.updateCoordinates(selectedTick, tickCoordinates.x, tickCoordinates.y);
      }
    }
    if (this.state !== prevState) {
      this.onDraw();
    }
  }

  onSave () {
    const {saveGesture} = this.props;
    const {name, description, id, date} = this.state;
    const gesture = {name, description, id, date, actions: this.convertCoordinates(COORD_TYPE.PERCENTAGES)};
    if (!this.validatePointerNames(gesture.actions)) {
      saveGesture(gesture);
      this.displayNotificationMsg(MSG_TYPES.SUCCESS, 'Successfully Saved Gesture');
    } else {
      this.displayNotificationMsg(MSG_TYPES.ERROR, 'Cannot have duplicate pointer names');
    }
  }

  onSaveAs () {
    const {saveGesture} = this.props;
    const {name, description} = this.state;
    const gesture = {name, description, actions: this.convertCoordinates(COORD_TYPE.PERCENTAGES)};
    if (!this.validatePointerNames(gesture.actions)) {
      saveGesture(gesture);
      this.displayNotificationMsg(MSG_TYPES.SUCCESS, `Successfully Saved Gesture As ${name}`);
    } else {
      this.displayNotificationMsg(MSG_TYPES.ERROR, 'Cannot have duplicate pointer names');
    }
  }

  onPlay () {
    const {applyClientMethod} = this.props;
    const pointers = this.convertCoordinates(COORD_TYPE.PIXELS);
    if (!this.validatePointerNames(pointers)) {
      const actions = this.formatGesture(pointers);
      applyClientMethod({methodName: SCREENSHOT_INTERACTION_MODE.GESTURE, args: [actions]});
    } else {
      this.displayNotificationMsg(MSG_TYPES.ERROR, 'Cannot have duplicate pointer names');
    }
  }

  onDraw () {
    const {displayGesture} = this.props;
    const gesture = this.convertCoordinates(COORD_TYPE.PIXELS);
    displayGesture(gesture);
  }

  onBack () {
    const {hideGestureEditor, removeLoadedGesture, removeGestureDisplay, unselectTick} = this.props;
    unselectTick();
    removeGestureDisplay();
    removeLoadedGesture();
    hideGestureEditor();
  }

  // Check if pointer names are duplicates before saving/playing
  validatePointerNames (pointers) {
    const duplicates = {};
    for (const pointer of pointers) {
      if (duplicates[pointer.name]) {
        return true;
      } else {
        duplicates[pointer.name] = pointer;
      }
    }
    return false;
  }

  displayNotificationMsg (type, msg) {
    notification[type]({
      message: msg,
      duration: 5,
    });
  }

  // Change gesture datastructure to fit Webdriver spec
  formatGesture (pointers) {
    const actions = {};
    for (const pointer of pointers) {
      actions[pointer.name] = pointer.ticks.map((tick) => {
        delete tick.id;
        return tick;
      });
    }
    return actions;
  }

  // This converts all the coordinates in the gesture to px/%
  convertCoordinates (type) {
    const {width, height} = this.props.windowSize;
    const {coordType, pointers} = this.state;
    const newPointers = JSON.parse(JSON.stringify(pointers));
    if (type !== coordType) {
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
    }
    return newPointers;
  }

  getDefaultMoveDuration (ticks, tickId, x2, y2, coordFromTap) {
    const {width, height} = this.props.windowSize;
    const {coordType} = this.state;
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
  }

  // Update tapped coordinates within local state
  updateCoordinates (tickKey, updateX, updateY) {
    if (updateX && updateY) {
      const {width, height} = this.props.windowSize;
      const {pointers, coordType} = this.state;
      const currentPointer = pointers.find((pointer) => pointer.id === tickKey[0]);
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
        currentTick.duration = this.getDefaultMoveDuration(currentPointer.ticks, currentTick.id, x, y, true);
      }
      this.setState({pointers});
    }
  }

  addPointer () {
    const {pointers} = this.state;
    const key = this.state.pointers.length + 1;
    const newKey = String(key);
    pointers.push({
      name: `pointer${key}`,
      ticks: [{id: `${key}.1`}],
      id: newKey,
      color: COLORS[key - 1]
    });
    this.setState({activeKey: newKey, pointers});
  }

  deletePointer (targetKey) {
    const {unselectTick} = this.props;
    const {pointers} = this.state;
    // 'newKey' variable keeps track of the previous pointer before deleting the current one
    // its default is the first pointer
    let newKey = '1';
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
        newKey = pointer.id;
      }
      return pointer;
    });
    unselectTick();
    this.setState({activeKey: newKey, pointers: newPointers});
  }

  addTick (pointerKey) {
    const {pointers} = this.state;
    const currentPointer = pointers.find((pointer) => pointer.id === pointerKey);
    const id = `${pointerKey}.${(currentPointer.ticks).length + 1}`;
    currentPointer.ticks.push({id});
    this.setState({pointers});
  }

  deleteTick (pointerKey, tickKey) {
    const {unselectTick} = this.props;
    const {pointers} = this.state;
    const currentPointer = pointers.find((pointer) => pointer.id === pointerKey);
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
    this.setState({pointers});
  }

  // Updates the current tick within local state
  updateTick (tick, msg, value) {
    const {POINTER_TYPE} = TICK_PROPS;
    const {selectTick} = this.props;
    const {pointers} = this.state;
    const currentPointer = pointers.find((p) => p.id === tick.id[0]);
    const targetTickIdx = currentPointer.ticks.findIndex((t) => t.id === tick.id);
    // currentTick can be assigned a new tick object if made changes to pointer types
    let currentTick = currentPointer.ticks[targetTickIdx];

    // We create an entire new tick for changes in pointer types to ensure previous properties are removed
    if (msg === POINTER_TYPE) {
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
        currentTick.duration = this.getDefaultMoveDuration(currentPointer.ticks, tick.id, currentTick.x, currentTick.y, false);
      }
    }

    currentPointer.ticks[targetTickIdx] = currentTick;
    this.setState({pointers});
  }

  // Reformats the gesture only for the timeline by populating the 'filler' ticks for each pointer
  // to match same length to keep timeline lengths consistent and accurate
  updateGestureForTimeline () {
    const copiedPointers = JSON.parse(JSON.stringify(this.state.pointers));
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
  }

  render () {
    const {selectedTick, selectTick, unselectTick, t} = this.props;
    const {PERCENTAGES, PIXELS} = COORD_TYPE;
    const {name, description, pointers, coordType, activeKey} = this.state;

    const tickButton = (tick) =>
      <center>
        <ButtonGroup className={InspectorCSS['tick-button-group']}>
          <Button
            key={`${tick.id}.left`}
            type={tick.button === BUTTONS.LEFT ? 'primary' : 'default'}
            className={InspectorCSS['tick-button-input']}
            onClick={() => this.updateTick(tick, TICK_PROPS.BUTTON, BUTTONS.LEFT)}>
              Left
          </Button>
          <Button
            key={`${tick.id}.right`}
            type={tick.button === BUTTONS.RIGHT ? 'primary' : 'default'}
            className={InspectorCSS['tick-button-input']}
            onClick={() => this.updateTick(tick, TICK_PROPS.BUTTON, BUTTONS.RIGHT)}>
              Right
          </Button>
        </ButtonGroup>
      </center>;

    const tickDuration = (tick) =>
      <center>
        <Input
          key={`${tick.id}.duration`}
          className={InspectorCSS['tick-input-box']}
          value={!isNaN(tick.duration) ? tick.duration : ''}
          placeholder='Duration'
          defaultValue={tick.duration}
          onChange={(e) => this.updateTick(tick, TICK_PROPS.DURATION, e.target.value)}
          addonAfter='ms'/>
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
            onChange={(e) => this.updateTick(tick, TICK_PROPS.X, e.target.value)}/>
          <Input
            key={`${tick.id}.y`}
            className={InspectorCSS['tick-coord-box']}
            value={!isNaN(tick.y) ? tick.y : ''}
            placeholder='Y'
            defaultValue={tick.y}
            onChange={(e) => this.updateTick(tick, TICK_PROPS.Y, e.target.value)}/>
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
          onChange={(e) => this.updateTick(tick, TICK_PROPS.POINTER_TYPE, e)}>
          <Option className={InspectorCSS['option-inpt']} value={POINTER_MOVE} key={`${tick.id}.${POINTER_MOVE}`}>{DISPLAY.pointerMove}</Option>
          <Option className={InspectorCSS['option-inpt']} value={POINTER_DOWN} key={`${tick.id}.${POINTER_DOWN}`}>{DISPLAY.pointerDown}</Option>
          <Option className={InspectorCSS['option-inpt']} value={POINTER_UP} key={`${tick.id}.${POINTER_UP}`}>{DISPLAY.pointerUp}</Option>
          <Option className={InspectorCSS['option-inpt']} value={PAUSE} key={`${tick.id}.${PAUSE}`}>{DISPLAY.pause}</Option>
        </Select>
      </center>;

    const tapCoordinatesBtn = (tickId) =>
      <Tooltip title={selectedTick === tickId ? t('Click to Set Coordinates') : t('Set Coordinates Via Field')}>
        <Button
          key={`${tickId}.tap`}
          size='small'
          type={selectedTick === tickId ? 'primary' : 'text'}
          icon={<AimOutlined/>}
          onClick={() =>
            selectedTick === tickId ?
              unselectTick()
              :
              selectTick(tickId)}/>
      </Tooltip>;

    const tickCard = (tick) =>
      <Card hoverable={true} key={tick.id} className={InspectorCSS['tick-card']}
        extra={<>{tick.type === POINTER_MOVE && tapCoordinatesBtn(tick.id)}
          <Button size='small' type='text' icon={<CloseOutlined />} key={`${tick.id}.remove`}
            onClick={() => this.deleteTick(tick.id[0], tick.id)}/></>}>
        <Space className={InspectorCSS['space-container']} direction='vertical' size='middle'>
          {tickType(tick)}
          {(tick.type === POINTER_MOVE || tick.type === PAUSE) && tickDuration(tick)}
          {(tick.type === POINTER_DOWN || tick.type === POINTER_UP) && tickButton(tick)}
          {tick.type === POINTER_MOVE && tickCoords(tick)}
        </Space>
      </Card>;

    const pageContent =
      <Tabs
        type='editable-card'
        onChange={(newActiveKey) => this.setState({activeKey: newActiveKey})}
        activeKey={activeKey}
        onEdit={(targetKey, action) => action === ACTION_TYPES.ADD ? this.addPointer() : this.deletePointer(targetKey)}
        hideAdd={pointers.length === 5}
        centered={true}
        tabBarGutter={10}>
        {pointers.map((pointer) => (
          <TabPane
            tab={<Tooltip title={t('Edit')} mouseEnterDelay={1}>
              <Input
                key={pointer.id}
                className={InspectorCSS['pointer-title']}
                style={{ cursor: activeKey === pointer.id ? CURSOR.TEXT : CURSOR.POINTER, textDecorationColor: pointer.color}}
                value={pointer.name}
                defaultValue={pointer.name}
                bordered={false}
                maxLength={10}
                onChange={(e) => {pointer.name = e.target.value; this.setState({pointers});}}/>
            </Tooltip>}
            key={pointer.id}>
            <Row gutter={[24, 24]}>
              {pointer.ticks.map((tick) =>
                <Col xs={12} sm={12} md={12} lg={8} xl={6} xxl={4} key={`${tick.id}.col1`}>
                  <div>
                    {tickCard(tick)}
                  </div>
                </Col>
              )}
              <Col xs={12} sm={12} md={12} lg={8} xl={6} xxl={4} key={`${pointer.id}.col1`}>
                <Card className={InspectorCSS['tick-plus-card']} bordered={false}>
                  <center>
                    <Button className={InspectorCSS['tick-plus-btn']} icon={<PlusCircleOutlined/>}
                      onClick={() => this.addTick(pointer.id)} key={ACTION_TYPES.ADD}/>
                  </center>
                </Card>
              </Col>
            </Row>
          </TabPane>
        ))}
      </Tabs>;


    const timeline = this.updateGestureForTimeline().map((pointer) =>
      <center key={pointer.id}>
        <Steps key={pointer.id} className={InspectorCSS['gesture-header-timeline']}
          style={{'--timelineColor': pointer.color}}>
          {pointer.ticks.map((tick) => {
            if (tick.type !== STATUS.FILLER) {
              const {type, duration, button, x, y} = tick;
              const iconStyle = {color: pointer.color};
              return <Step key='timeline-steps' status={tick.customStep || STATUS.FINISH} icon={
                <Popover placement='bottom'
                  title={<center key={tick.id}>{DISPLAY[type]}</center>}
                  content={
                    <div className={InspectorCSS['timeline-tick-title']}>
                      {duration !== undefined && <p>Duration: {duration}ms</p>}
                      {button !== undefined && <p>Button: {button === BUTTONS.LEFT ? 'Left' : 'Right'}</p>}
                      {x !== undefined && <p>X: {x}{coordType === PIXELS ? 'px' : '%'}</p>}
                      {y !== undefined && <p>Y: {y}{coordType === PIXELS ? 'px' : '%'}</p>}
                    </div>
                  }>
                  {type === POINTER_MOVE && <RightCircleOutlined key={tick.id} className={InspectorCSS['gesture-header-icon']} style={iconStyle}/>}
                  {type === POINTER_DOWN && <DownCircleOutlined key={tick.id} className={InspectorCSS['gesture-header-icon']} style={iconStyle}/>}
                  {type === POINTER_UP && <UpCircleOutlined key={tick.id} className={InspectorCSS['gesture-header-icon']} style={iconStyle}/>}
                  {type === PAUSE && <PauseCircleOutlined key={tick.id} className={InspectorCSS['gesture-header-icon']} style={iconStyle}/>}
                </Popover>}/>;
            } else {
              return <Step key='transparent-steps' status={STATUS.WAIT}
                icon={<RightCircleOutlined className={InspectorCSS['gesture-header-icon']}
                  style={{color: tick.color}}/>}/>;
            }
          })}
        </Steps>
      </center>);

    const headerDescription =
      <Tooltip key='editDescription' placement='topLeft' title={t('Edit')}>
        <Input
          key={description}
          defaultValue={description}
          className={InspectorCSS['gesture-header-description']}
          onChange={(e) => {this.setState({description: e.target.value});}}
          size='small'/>
      </Tooltip>;

    const headerButtons =
      [<ButtonGroup key='coordTypes'>
        <Button
          key={PERCENTAGES}
          className={InspectorCSS['gesture-header-coord-btn']}
          type={coordType === PERCENTAGES ? 'primary' : 'default'}
          onClick={() => this.setState({coordType: PERCENTAGES, pointers: this.convertCoordinates(PERCENTAGES)})}
          size='small'>%</Button>
        <Button
          key={PIXELS}
          className={InspectorCSS['gesture-header-coord-btn']}
          type={coordType === PIXELS ? 'primary' : 'default'}
          onClick={() => this.setState({coordType: PIXELS, pointers: this.convertCoordinates(PIXELS)})}
          size='small'>px</Button>
      </ButtonGroup>,
      <Tooltip key='playGesture' title={t('Play')}>
        <Button key='play' type='primary' icon={<PlayCircleOutlined/>} onClick={() => this.onPlay()}/>
      </Tooltip>,
      <Button key='saveAs' onClick={() => this.onSaveAs()}>Save As</Button>,
      <Button key='save' onClick={() => this.onSave()}>Save</Button>];

    const headerTitle =
      <Tooltip key='editTitle' placement='topLeft' title={t('Edit')}>
        <Input
          defaultValue={name}
          className={InspectorCSS['gesture-header-title']}
          onChange={(e) => {this.setState({name: e.target.value});}}
          key={name}
          size='small'/>
      </Tooltip>;

    const pageHeader =
      <PageHeader
        className={InspectorCSS['gesture-header']}
        onBack={() => this.onBack()}
        title={headerTitle}
        extra={headerButtons}
        footer={<>{headerDescription}<Divider/>{timeline}</>}/>;

    return <>{pageHeader}{pageContent}</>;
  }
}

export default withTranslation(GestureEditor);