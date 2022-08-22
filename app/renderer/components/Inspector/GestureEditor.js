import React, { Component } from 'react';
import { Tabs, Input, Button, Card, Select, Row, Col, notification,
         PageHeader, Space, Steps, Divider, Tooltip, Popover } from 'antd';
import { PlayCircleOutlined, PlusCircleOutlined,
         CloseOutlined, AimOutlined, RightCircleOutlined,
         DownCircleOutlined, UpCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';
import { withTranslation } from '../../util';
import InspectorCSS from './Inspector.css';

const {TabPane} = Tabs;
const {Option} = Select;
const {Step} = Steps;
const ButtonGroup = Button.Group;

const COLORS = ['#FF3333', '#FF8F00', '#B65FF4', '#6CFF00', '#00FFDC'];
const BUTTONS = {LEFT: 0, RIGHT: 1};
const ACTION_TYPES = {ADD: 'add', REMOVE: 'remove'};
const COORD_TYPE = {PERCENTAGES: 'percentages', PIXELS: 'pixels'};
const TICK_PROPS = {POINTER_TYPE: 'pointerType', DURATION: 'duration', BUTTON: 'button', X: 'x', Y: 'y'};
const CURSOR = {POINTER: 'pointer', TEXT: 'text'};
const STATUS = {WAIT: 'wait', FINISH: 'finish', COLOR: '#FFFFFF', FILLER: 'filler'};
const POINTER_TYPES = {pointerUp: 'pointerUp', pointerDown: 'pointerDown',
                       pause: 'pause', pointerMove: 'pointerMove'};

const DEFAULT_POINTERS = () => [{
  name: 'pointer1',
  ticks: [{id: '1.1'}],
  color: '#FF3333',
  id: '1',
}];

class GestureEditor extends Component {

  constructor (props) {
    super(props);
    this.interval = null;
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

  // Draw gesture every 1000 ms
  componentDidMount () {
    this.interval = setInterval(() => {
      this.onDraw();
    }, 1000);
  }

  // Retrieve coordinates when user taps screenshot
  componentDidUpdate (prevProps) {
    const {selectedTick, tickCoordinates} = this.props;
    if (selectedTick !== prevProps.selectedTick || tickCoordinates !== prevProps.tickCoordinates) {
      if (tickCoordinates) {
        this.updateCoordinates(selectedTick, tickCoordinates.x, tickCoordinates.y);
      }
    }
  }

  componentWillUnmount () {
    clearInterval(this.interval);
  }

  onSave () {
    const {saveGesture, hideGestureEditor, removeLoadedGesture, removeGestureDisplay, unselectTick} = this.props;
    const {name, description, id, date} = this.state;
    const gesture = {name, description, id, date, actions: this.convertCoordinates(COORD_TYPE.PERCENTAGES)};
    if (!this.duplicatesExist(gesture.actions)) {
      saveGesture(gesture);
      hideGestureEditor();
      removeLoadedGesture();
      unselectTick();
      removeGestureDisplay();
    }
  }

  onSaveAs () {
    const {saveGesture} = this.props;
    const {name, description} = this.state;
    const gesture = {name, description, actions: this.convertCoordinates(COORD_TYPE.PERCENTAGES)};
    if (!this.duplicatesExist(gesture.actions)) {
      saveGesture(gesture);
    }
  }

  onPlay () {
    const {applyClientMethod} = this.props;
    const pointers = this.convertCoordinates(COORD_TYPE.PIXELS);
    if (!this.duplicatesExist(pointers)) {
      const actions = this.formatGesture(pointers);
      applyClientMethod({methodName: 'gesture', args: [actions]});
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
  duplicatesExist (pointers) {
    const duplicates = {};
    for (const pointer of pointers) {
      if (duplicates[pointer.name]) {
        notification.error({
          message: 'Cannot have duplicate pointer names',
          duration: 5,
        });
        return true;
      } else {
        duplicates[pointer.name] = true;
      }
    }
    return false;
  }

  // Change gesture datastructure to fit Webdriver spec
  formatGesture (pointers) {
    const actions = {};
    for (const pointer of pointers) {
      actions[pointer.name] = (pointer.ticks).map((tick) => {
        delete tick.id;
        return tick;
      });
    }
    return actions;
  }

  // This converts all the coordinates in the gesture to px/%
  convertCoordinates (type) {
    const {coordType, pointers} = this.state;
    const newPointers = JSON.parse(JSON.stringify(pointers));
    if (type !== coordType) {
      newPointers.map((pointer) => {
        (pointer.ticks).map((tick) => {
          if (tick.type === POINTER_TYPES.pointerMove) {
            if (type === COORD_TYPE.PIXELS) {
              tick.x = this.percentageToPixels(tick.x, true);
              tick.y = this.percentageToPixels(tick.y, false);
            } else {
              tick.x = this.pixelsToPercentage(tick.x, true);
              tick.y = this.pixelsToPercentage(tick.y, false);
            }
          }
          return tick;
        });
        return pointer;
      });
    }
    return newPointers;
  }

  pixelsToPercentage (pixel, isX) {
    const {width, height} = this.props.windowSize;
    if (!isNaN(pixel)) {
      if (isX) {
        return parseFloat(((pixel / width) * 100).toFixed(1), 10);
      } else {
        return parseFloat(((pixel / height) * 100).toFixed(1), 10);
      }
    } else {
      return 0;
    }
  }

  percentageToPixels (percentage, isX) {
    const {width, height} = this.props.windowSize;
    if (!isNaN(percentage)) {
      if (isX) {
        return Math.round(width * (percentage / 100));
      } else {
        return Math.round(height * (percentage / 100));
      }
    } else {
      return 0;
    }
  }

  // Update tapped coordinates within local state
  updateCoordinates (tickKey, updateX, updateY) {
    if (updateX && updateY) {
      const {pointers, coordType} = this.state;
      const currentPointer = pointers.find((pointer) => pointer.id === tickKey[0]);
      const currentTick = (currentPointer.ticks).find((tick) => tick.id === tickKey);
      const x = parseFloat(updateX, 10);
      const y = parseFloat(updateY, 10);
      if (coordType === COORD_TYPE.PERCENTAGES) {
        currentTick.x = this.pixelsToPercentage(x, true);
        currentTick.y = this.pixelsToPercentage(y, false);
      } else {
        currentTick.x = x;
        currentTick.y = y;
      }
      this.setState({pointers});
    }
  }

  // Actions for adding/deleting pointers
  pointerAction (targetKey, action) {
    const {unselectTick} = this.props;
    const {pointers} = this.state;

    if (action === ACTION_TYPES.ADD) {
      const key = this.state.pointers.length + 1;
      const newKey = String(key);
      pointers.push({
        name: `pointer${key}`,
        ticks: [{id: `${key}.1`}],
        id: newKey,
        color: COLORS[key - 1]
      });
      this.setState({activeKey: newKey, pointers});
    } else {
      // newKey variable keeps track of the previous pointer before deleting the current one
      let newKey = '1';
      const filteredPointers = pointers.filter((pointer) => pointer.id !== targetKey);
      const newPointers = filteredPointers.map((pointer, index) => {
        const id = String(index + 1);
        if (id !== pointer.id) {
          pointer.id = id;
          pointer.color = COLORS[index];
          pointer.ticks = (pointer.ticks).map((tick) => {
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
  }

  // Actions for adding/deleting ticks
  tickAction (pointerKey, tickKey, action) {
    const {unselectTick} = this.props;
    const {pointers} = this.state;
    const currentPointer = pointers.find((pointer) => pointer.id === pointerKey);

    if (action === ACTION_TYPES.ADD) {
      const id = `${pointerKey}.${(currentPointer.ticks).length + 1}`;
      currentPointer.ticks.push({id});
    } else {
      const filteredTicks = currentPointer.ticks.filter((tick) => {
        if (tick.id === tickKey) {
          unselectTick();
        } else {
          return tick;
        }
      });
      const newTicks = filteredTicks.map((tick, index) => {
        const id = String(index + 1);
        if (tick.id !== id) {
          tick.id = `${tick.id[0]}.${id}`;
        }
        return tick;
      });
      currentPointer.ticks = newTicks;
    }
    this.setState({pointers});
  }

  // Updates the current tick within local state
  updateTick (tick, msg, value) {
    const {pointerMove, pointerDown, pointerUp, pause} = POINTER_TYPES;
    const {POINTER_TYPE} = TICK_PROPS;
    const {selectTick} = this.props;
    const {pointers} = this.state;
    const currentPointer = pointers.find((pointer) => pointer.id === tick.id[0]);
    currentPointer.ticks = (currentPointer.ticks).map((prevTick) => {
      if (prevTick.id === tick.id) {
        if (msg === POINTER_TYPE) {
          if (value === pointerMove) {
            selectTick(tick.id);
          }
          return {id: tick.id, type: value,
                  ...([pointerDown, pointerUp].includes(value) && {button: BUTTONS.LEFT}),
                  ...([pointerMove, pause].includes(value) && {duration: 0})};
        } else {
          tick[msg] = parseFloat(value, 10);
          return prevTick;
        }
      } else {
        return prevTick;
      }
    });
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
          pointer.ticks = [...pointer.ticks, ...fillers];
        }
      }
      return pointer;
    });
  }

  render () {
    const {selectedTick, selectTick, unselectTick, t} = this.props;
    const {pointerMove, pointerDown, pointerUp, pause} = POINTER_TYPES;
    const {PERCENTAGES, PIXELS} = COORD_TYPE;
    const {name, description, pointers, coordType, activeKey} = this.state;

    const tickButton = (tick, type) =>
      <center>
        <ButtonGroup className={InspectorCSS['tick-button-group']}>
          <Button
            key={`${tick.id}.left`}
            type={tick.button === BUTTONS.LEFT ? 'primary' : 'default'}
            className={InspectorCSS['tick-button-input']}
            onClick={() => this.updateTick(tick, type, BUTTONS.LEFT)}>
              Left
          </Button>
          <Button
            key={`${tick.id}.right`}
            type={tick.button === BUTTONS.RIGHT ? 'primary' : 'default'}
            className={InspectorCSS['tick-button-input']}
            onClick={() => this.updateTick(tick, type, BUTTONS.RIGHT)}>
              Right
          </Button>
        </ButtonGroup>
      </center>;

    const tickDuration = (tick, type) =>
      <center>
        <Input
          key={`${tick.id}.duration`}
          className={InspectorCSS['tick-input-box']}
          value={!isNaN(tick.duration) ? tick.duration : ''}
          placeholder={'Duration'}
          defaultValue={tick.duration}
          onChange={(e) => this.updateTick(tick, type, e.target.value)}
          addonAfter='ms'/>
      </center>;

    const tickCoords = (tick) =>
      <center>
        <div className={InspectorCSS['tick-input-box']}>
          <Input
            key={`${tick.id}.x`}
            className={InspectorCSS['tick-coord-box']}
            value={!isNaN(tick.x) ? tick.x : ''}
            placeholder={'X'}
            defaultValue={tick.x}
            onChange={(e) => this.updateTick(tick, TICK_PROPS.X, e.target.value)}/>
          <Input
            key={`${tick.id}.y`}
            className={InspectorCSS['tick-coord-box']}
            value={!isNaN(tick.y) ? tick.y : ''}
            placeholder={'Y'}
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
          <Option className={InspectorCSS['option-inpt']} value={pointerMove} key={`${tick.id}.${pointerMove}`}>Move</Option>
          <Option className={InspectorCSS['option-inpt']} value={pointerDown} key={`${tick.id}.${pointerDown}`}>Pointer Down</Option>
          <Option className={InspectorCSS['option-inpt']} value={pointerUp} key={`${tick.id}.${pointerUp}`}>Pointer Up</Option>
          <Option className={InspectorCSS['option-inpt']} value={pause} key={`${tick.id}.${pause}`}>Pause</Option>
        </Select>
      </center>;

    const tapCoordinatesBtn = (tickId) =>
      <Tooltip title={selectedTick === tickId ? t('Turn Off Click Coordinates') : t('Turn On Click Coordinates')}>
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
        extra={<>{tick.type === pointerMove && tapCoordinatesBtn(tick.id)}
          <Button size='small' type='text' icon={<CloseOutlined />} key={`${tick.id}.remove`}
            onClick={() => this.tickAction(tick.id[0], tick.id, ACTION_TYPES.REMOVE)}/></>}>
        <Space className={InspectorCSS['space-container']} direction='vertical' size='middle'>
          {tickType(tick)}
          {(tick.type === pointerMove || tick.type === pause) && tickDuration(tick, TICK_PROPS.DURATION)}
          {(tick.type === pointerDown || tick.type === pointerUp) && tickButton(tick, TICK_PROPS.BUTTON)}
          {tick.type === pointerMove && tickCoords(tick)}
        </Space>
      </Card>;

    const pageContent =
      <Tabs
        type='editable-card'
        onChange={(newActiveKey) => this.setState({activeKey: newActiveKey})}
        activeKey={activeKey}
        onEdit={(targetKey, action) => this.pointerAction(targetKey, action)}
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
              {(pointer.ticks).map((tick) =>
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
                      onClick={() => this.tickAction(pointer.id, null, ACTION_TYPES.ADD)} key={ACTION_TYPES.ADD}/>
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
          {(pointer.ticks).map((tick) => {
            if (tick.type !== STATUS.FILLER) {
              const {type, duration, button, x, y} = tick;
              const display = {pointerUp: 'Pointer Up', pointerDown: 'Pointer Down', pause: 'Pause', pointerMove: 'Move'};
              const iconStyle = {color: pointer.color};
              return <Step key='step1' status={tick.customStep || STATUS.FINISH} icon={
                <Popover placement='bottom'
                  title={<center key={tick.id}>{display[type]}</center>}
                  content={
                    <div className={InspectorCSS['timeline-tick-title']}>
                      {duration !== undefined && <p>Duration: {duration}ms</p>}
                      {button !== undefined && <p>Button: {button === BUTTONS.LEFT ? 'Left' : 'Right'}</p>}
                      {x && <p>X: {x}{coordType === PIXELS ? 'px' : '%'}</p>}
                      {y && <p>Y: {y}{coordType === PIXELS ? 'px' : '%'}</p>}
                    </div>
                  }>
                  {type === pointerMove && <RightCircleOutlined key={tick.id} className={InspectorCSS['gesture-header-icon']} style={iconStyle}/>}
                  {type === pointerDown && <DownCircleOutlined key={tick.id} className={InspectorCSS['gesture-header-icon']} style={iconStyle}/>}
                  {type === pointerUp && <UpCircleOutlined key={tick.id} className={InspectorCSS['gesture-header-icon']} style={iconStyle}/>}
                  {type === pause && <PauseCircleOutlined key={tick.id} className={InspectorCSS['gesture-header-icon']} style={iconStyle}/>}
                </Popover>}/>;
            } else {
              return <Step key='step2' status={STATUS.WAIT}
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