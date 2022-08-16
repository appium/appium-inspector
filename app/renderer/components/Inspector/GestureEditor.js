import React, { Component } from 'react';
import { Tabs, Input, Button, Card, Select, Row, Col, PageHeader, Space, Steps, Divider, Tooltip, Popover } from 'antd';
import { PlayCircleOutlined, PlusCircleOutlined, CloseOutlined, AimOutlined, RightCircleOutlined, DownCircleOutlined, UpCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';
import { withTranslation } from '../../util';
import InspectorCSS from './Inspector.css';
const { TabPane } = Tabs;
const { Option } = Select;
const ButtonGroup = Button.Group;
const {Step} = Steps;

const COLORS = ['#FF3333', '#FF8F00', '#B65FF4', '#6CFF00', '#00FFDC'];

const DEFAULT_POINTERS = () => Array.from({ length: 1 }).map((_, index) => {
  const id = String(index + 1);
  return { title: `pointer${id}`, content: {'1.1': {}}, key: id, color: COLORS[index]};
});

const POINTER_TYPES = {
  pointerUp: 'Pointer Up',
  pointerDown: 'Pointer Down',
  pause: 'Pause',
  pointerMove: 'Move'
};

class GestureEditor extends Component {

  constructor (props) {
    super(props);
    this.interval = null;
    this.state = {
      name: this.props.loadedGesture ? this.props.loadedGesture.name : 'Untitled',
      description: this.props.loadedGesture ? this.props.loadedGesture.description : 'Add Description',
      date: this.props.loadedGesture ? this.props.loadedGesture.date : null,
      id: this.props.loadedGesture ? this.props.loadedGesture.id : null,
      pointers: this.props.loadedGesture ? this.loadPointers() : DEFAULT_POINTERS(),
      coordType: 'percentages',
      activeKey: '1',
      timelineKey: '1',
    };
  }

  componentDidMount () {
    this.interval = setInterval(() => {
      this.onDrawGesture();
    }, 1000);
  }

  componentDidUpdate (prevProps) {
    const {selectedTick, tickCoordinates} = this.props;
    if (selectedTick !== prevProps.selectedTick || tickCoordinates !== prevProps.tickCoordinates) {
      if (tickCoordinates) {
        this.updateTickFromTap(selectedTick, tickCoordinates.x, tickCoordinates.y);
      }
    }
  }

  componentWillUnmount () {
    clearInterval(this.interval);
  }

  loadPointers () {
    const { actions } = this.props.loadedGesture;

    let counter = 0;
    const pointers = Object.keys(actions).map((pointerName) => {
      counter = counter + 1;
      const content = {};
      for (let i = 0; i < actions[pointerName].length; i++) {
        content[`${counter}.${i + 1}`] = actions[pointerName][i];
      }
      return { title: pointerName, key: String(counter), content, color: COLORS[counter - 1]};
    });

    return pointers;

  }

  formatGesture (saveAs, save) {
    const {name, description, id, date, pointers} = this.state;
    const gesture = {
      name,
      description,
      id,
      date,
      actions: {},
    };
    pointers.map((obj) => {
      gesture.actions[obj.title] = Object.keys(obj.content).map((key) => {
        if (obj.content[key].type === 'pointerMove') {
          const {x, y, type, duration} = obj.content[key];
          if (this.state.coordType === 'percentages') {
            if (save) {
              return {type, duration: parseFloat(duration), x: parseFloat(x), y: parseFloat(y)};
            } else {
              const xX = parseFloat(this.percentageToPixels(x, true));
              const yY = parseFloat(this.percentageToPixels(y, false));
              return {type, duration: parseFloat(duration), x: xX, y: yY};
            }
          } else {
            if (save) {
              const xX = parseFloat(this.pixelsToPercentage(x, true));
              const yY = parseFloat(this.pixelsToPercentage(y, false));
              return {type, duration: parseFloat(duration), x: xX, y: yY};
            } else {
              return {type, duration: parseFloat(duration), x: parseFloat(x), y: parseFloat(y)};
            }
          }
        } else {
          return obj.content[key];
        }
      });
    });

    if (saveAs) {
      gesture.id = null;
      gesture.date = null;
    }

    return gesture;
  }

  onSaveGesture () {
    const {saveGesture, hideGestureEditor, unsetLoadedGesture, undrawGesture, unselectTick} = this.props;
    const gesture = this.formatGesture(false, true);
    saveGesture(gesture);
    hideGestureEditor();
    unsetLoadedGesture();
    unselectTick();
    undrawGesture();
  }

  onSaveAsGesture () {
    const {saveGesture, unsetLoadedGesture, undrawGesture} = this.props;
    const gesture = this.formatGesture(true, true);
    saveGesture(gesture);
    unsetLoadedGesture();
    undrawGesture();
  }

  onPlayGesture () {
    const {applyClientMethod} = this.props;
    const {actions} = this.formatGesture(false, false);
    applyClientMethod({methodName: 'gesture', args: [actions]});
  }

  onDrawGesture () {
    const {drawGesture} = this.props;
    const gesture = this.formatGesture(false, false);
    gesture.colors = (this.state.pointers).map((pointer) => pointer.color);

    drawGesture(gesture);
  }

  onBacktoSaved () {
    const {hideGestureEditor, unsetLoadedGesture, undrawGesture, unselectTick} = this.props;
    hideGestureEditor();
    unsetLoadedGesture();
    unselectTick();
    undrawGesture();
  }

  pixelsToPercentage (pixel, isPixelX) {
    const {width, height} = this.props.windowSize;
    if (Number(pixel)) {
      const intPixel = parseInt(pixel, 10);
      if (isPixelX) {
        return String(((intPixel / width) * 100).toFixed(1));
      } else {
        return String(((intPixel / height) * 100).toFixed(1));
      }
    }
  }

  percentageToPixels (percentage, isPercentageX) {
    const {width, height} = this.props.windowSize;
    if (Number(percentage)) {
      const intPercentage = parseInt(percentage, 10);
      if (isPercentageX) {
        return String(Math.round(width * (intPercentage / 100)));
      } else {
        return String(Math.round(height * (intPercentage / 100)));
      }
    }
  }

  updateTickFromTap (tickKey, x, y) {
    if (x && y) {
      const pointerKey = tickKey[0];
      const { pointers, coordType } = this.state;
      const currentPointer = pointers.filter((pointer) => pointer.key === pointerKey)[0];
      const currentTick = currentPointer.content[tickKey];

      if (coordType === 'percentages') {
        currentTick.x = this.pixelsToPercentage(x, true);
      } else {
        currentTick.x = x;
      }

      if (coordType === 'percentages') {
        currentTick.y = this.pixelsToPercentage(y, false);
      } else {
        currentTick.y = y;
      }

      this.setState({pointers});
    }
  }

  render () {

    const {selectedTick, selectTick, unselectTick} = this.props;

    const addPointer = () => {
      const key = this.state.pointers.length + 1;
      const newPointers = [...this.state.pointers];
      newPointers.push({
        title: `pointer${key}`,
        content: {},
        key: String(key),
        color: COLORS[key - 1]
      });
      newPointers[key - 1].content[`${key}.1`] = {};
      this.setState({activeKey: String(key), pointers: newPointers});
    };

    const removePointer = (targetKey) => {
      let counter = 1;
      const filteredPointers = this.state.pointers.filter((pointer) => pointer.key !== targetKey);
      const newPointers = filteredPointers.map((pointer) => {
        if (String(counter) !== pointer.key) {
          pointer.key = String(counter);
          pointer.color = COLORS[counter - 1];
          const content = {};
          let tempC = 1;
          Object.keys(pointer.content).map((key) => {content[`${String(counter)}.${tempC}`] = pointer.content[key]; tempC = tempC + 1;});
          pointer.content = content;
        }
        counter = counter + 1;
        return pointer;
      });

      this.setState({activeKey: '1', pointers: newPointers});
    };

    const pointerAction = (targetKey, action) => {
      if (action === 'add') {
        addPointer();
      } else {
        removePointer(targetKey);
      }
    };

    const deleteTick = (pointerKey, tickKey) => {
      const { pointers } = this.state;
      const currentPointer = pointers.filter((pointer) => pointer.key === pointerKey)[0];
      const content = {};
      let counter = 1;

      for (const key of Object.keys(currentPointer.content)) {
        if (key !== tickKey) {
          content[`${key.substring(0, 1)}.${counter}`] = currentPointer.content[key];
          counter = counter + 1;
        }
      }

      const newPointers = pointers.filter((pointer) => pointer.content = pointer.key === pointerKey ? content : pointer.content);
      this.setState({pointers: newPointers});
    };

    const addTick = (pointerKey) => {
      const { pointers } = this.state;
      const currentPointer = pointers.filter((pointer) => pointer.key === pointerKey)[0];
      const newTick = `${pointerKey}.${Object.keys(currentPointer.content).length + 1}`;
      currentPointer.content[newTick] = {};
      this.setState({pointers});
    };

    const editTickOptions = (pointerKey, tickKey, msg, value) => {
      const { pointers } = this.state;
      const currentPointer = pointers.filter((pointer) => pointer.key === pointerKey)[0];
      const currentTick = currentPointer.content[tickKey];

      if (msg === 'Pointer Type') {
        currentTick.type = value;
        if (value === 'pointerDown' || value === 'pointerUp') {
          currentTick.button = 0;
        }
        if (value === 'pointerMove') {
          currentTick.pixelX = true;
          currentTick.pixelY = true;
          currentTick.x = 0;
          currentTick.y = 0;
          selectTick(tickKey);
        }

        if (value === 'pointerMove' || value === 'pause') {
          currentTick.duration = 0;
        }
      } else if (msg === 'Duration') {
        currentTick.duration = value;
      } else if (msg === 'Button') {
        currentTick.button = value;
      } else if (msg === 'X') {
        currentTick.x = value;
      } else if (msg === 'Y') {
        currentTick.y = value;
      }
      this.setState({pointers});
    };

    const checkItem = (pointerKey, tickKey) => this.state.pointers.filter((pointer) => pointer.key === pointerKey)[0].content[tickKey].type;

    const pointerButton = (pointerKey, tickKey, index, type) =>
      <center>
        <ButtonGroup className={InspectorCSS['tick-button-group']}>
          <Button
            type={this.state.pointers[index].content[tickKey].button === 0 ? 'primary' : 'default'}
            className={InspectorCSS['tick-button-input']}
            onClick={() => editTickOptions(pointerKey, tickKey, type, 0)}>
              Left
          </Button>
          <Button
            type={this.state.pointers[index].content[tickKey].button === 1 ? 'primary' : 'default'}
            className={InspectorCSS['tick-button-input']}
            onClick={() => editTickOptions(pointerKey, tickKey, type, 1)}>
              Right
          </Button>
        </ButtonGroup>
      </center>;

    const pointerInputBoxes = (pointerKey, tickKey, index, type, addon) =>
      <center>
        <Input
          className={InspectorCSS['tick-input-box']}
          value={this.state.pointers[index].content[tickKey][type.toLowerCase()]}
          placeholder={type}
          defaultValue={this.state.pointers[index].content[tickKey][type.toLowerCase()]}
          onChange={(e) => editTickOptions(pointerKey, tickKey, type, e.target.value)}
          addonAfter={addon}/>
      </center>;


    const pointerInput = (pointerKey, tickKey, index) =>
      <center>
        <Select
          className={InspectorCSS['tick-pointer-input']}
          placeholder='Pointer Type'
          defaultValue={this.state.pointers[index].content[tickKey].type}
          size='middle'
          dropdownMatchSelectWidth={false}
          onChange={(e) => editTickOptions(pointerKey, tickKey, 'Pointer Type', e)}>
          <Option value="pointerMove" key='pointerMove'><center>Move</center></Option>
          <Option value="pointerDown" key='pointerDown'><center>Pointer Down</center></Option>
          <Option value="pointerUp" key='pointerUp'><center>Pointer Up</center></Option>
          <Option value="pause" key='pause'><center>Pause</center></Option>
        </Select>
      </center>;

    const tapCoordinatesBtn = (tickKey) =>
      <Tooltip title={selectedTick === tickKey ? 'Turn Off Click Coordinates' : 'Turn On Click Coordinates'}>
        <Button
          size='small'
          type={selectedTick === tickKey ? 'primary' : 'text'}
          icon={<AimOutlined />}
          onClick={() =>
            selectedTick === tickKey ?
              unselectTick()
              :
              selectTick(tickKey)
          }
        />
      </Tooltip>;

    const editTick = (pointerKey, tickKey, index) =>
      <Card hoverable={true} key={tickKey} className={InspectorCSS['tick-card']}
        extra={<>
          {checkItem(pointerKey, tickKey) === 'pointerMove' && tapCoordinatesBtn(tickKey)}
          <Button size='small' type='text' icon={<CloseOutlined />} onClick={() => deleteTick(pointerKey, tickKey)} />
        </>}>
        <Space className={InspectorCSS['space-container']} direction="vertical" size="middle">
          {pointerInput(pointerKey, tickKey, index)}
          <center>
            {(checkItem(pointerKey, tickKey) === 'pointerMove' || checkItem(pointerKey, tickKey) === 'pause') &&
              pointerInputBoxes(pointerKey, tickKey, index, 'Duration', 'ms')}
          </center>
          {(checkItem(pointerKey, tickKey) === 'pointerDown' || checkItem(pointerKey, tickKey) === 'pointerUp') &&
            pointerButton(pointerKey, tickKey, index, 'Button')}
          <center>
            {checkItem(pointerKey, tickKey) === 'pointerMove' &&
              pointerInputBoxes(pointerKey, tickKey, index, 'X', this.state.coordType === 'pixels' ? 'px' : '%')}
          </center>
          <center>
            {checkItem(pointerKey, tickKey) === 'pointerMove' &&
              pointerInputBoxes(pointerKey, tickKey, index, 'Y', this.state.coordType === 'pixels' ? 'px' : '%')}
          </center>
        </Space>
      </Card>;

    const pageContent =
      <Tabs
        type="editable-card"
        onChange={(newActiveKey) => this.setState({activeKey: newActiveKey})}
        activeKey={this.state.activeKey}
        onEdit={pointerAction}
        hideAdd={this.state.pointers.length === 5}
        centered={true}
        tabBarGutter={10}>
        {this.state.pointers.map((pointer, index) => (
          <TabPane
            tab={
              <Tooltip title='Edit' mouseEnterDelay={1}>
                <Input
                  className={InspectorCSS['pointer-title']}
                  // eslint-disable-next-line react-native/no-inline-styles
                  style={{ cursor: this.state.activeKey === pointer.key ? 'text' : 'pointer', textDecorationColor: pointer.color}}
                  defaultValue={pointer.title}
                  bordered={false}
                  maxLength={10}
                  onChange={(e) => {pointer.title = e.target.value; this.setState({pointers: this.state.pointers});}}/>
              </Tooltip>
            }
            key={pointer.key}>
            <Row gutter={[24, 24]}>
              {Object.keys(pointer.content).map((key) =>
                <Col xs={12} sm={12} md={12} lg={8} xl={6} xxl={4}>
                  <div>
                    {editTick(pointer.key, key, index)}
                  </div>
                </Col>
              )}
              <Col xs={12} sm={12} md={12} lg={8} xl={6} xxl={4}>
                <Card className={InspectorCSS['tick-plus-card']} bordered={false}>
                  <center>
                    <Button className={InspectorCSS['tick-plus-btn']} icon={<PlusCircleOutlined />} onClick={() => addTick(pointer.key)} key="add" />
                  </center>
                </Card>
              </Col>
            </Row>
          </TabPane>
        ))}
      </Tabs>;

    const currentPointer = this.state.pointers.filter((pointer) => pointer.key === this.state.timelineKey)[0];

    const timeline =
      <>
        <Select
          placeholder='Pointer'
          defaultValue={this.state.timelineKey}
          size='middle'
          dropdownMatchSelectWidth={false}
          onChange={(e) => this.setState({timelineKey: e})}>
          {(this.state.pointers).map((pointer) => <Option value={pointer.key} key={pointer.key}><center>{pointer.title}</center></Option>)}
        </Select>
        <center>
          <Steps className={InspectorCSS['gesture-header-timeline']}>
            {Object.keys(currentPointer.content).map((tickKey) => {
              const {type, duration, button, x, y} = currentPointer.content[tickKey];
              const timelineDash = document.querySelector('._gesture-header-timeline_0387c');
              if (timelineDash) {
                timelineDash.style.setProperty('--timeline', currentPointer.color);
              }
              return <Step status="finish" icon={
                <Popover placement='bottom'
                  title={<center>{POINTER_TYPES[type]}</center>}
                  content={
                    <div className={InspectorCSS['timeline-tick-title']}>
                      {duration !== undefined && <p>Duration: {duration}ms</p>}
                      {button !== undefined && <p>Button: {button === 0 ? 'Left' : 'Right'}</p>}
                      {x !== undefined && <p>X: {x}{this.state.coordType === 'pixels' ? 'px' : '%'}</p>}
                      {y !== undefined && <p>Y: {y}{this.state.coordType === 'pixels' ? 'px' : '%'}</p>}
                    </div>
                  }>
                  {type === 'pointerMove' && <RightCircleOutlined style={{ color: currentPointer.color}} />}
                  {type === 'pointerDown' && <DownCircleOutlined style={{ color: currentPointer.color}} />}
                  {type === 'pointerUp' && <UpCircleOutlined style={{ color: currentPointer.color}} />}
                  {type === 'pause' && <PauseCircleOutlined style={{ color: currentPointer.color}} />}
                </Popover>}
              />;
            })}
          </Steps>
        </center>
      </>;

    const switchCoords = (type) => {
      const {coordType, pointers} = this.state;
      if (type !== coordType) {

        for (const pointer of pointers) {
          const ticks = pointer.content;
          for (const tick in ticks) {
            if (ticks[tick].type === 'pointerMove') {
              if (type === 'pixels') {
                ticks[tick].x = this.percentageToPixels(ticks[tick].x, true);
                ticks[tick].y = this.percentageToPixels(ticks[tick].y, false);
              } else {
                ticks[tick].x = this.pixelsToPercentage(ticks[tick].x, true);
                ticks[tick].y = this.pixelsToPercentage(ticks[tick].y, false);
              }
            }
          }
        }

        this.setState({coordType: type, pointers});
      }
    };

    const coordTypeBtns =
        <ButtonGroup>
          <Button
            className={InspectorCSS['gesture-header-coord-btn']}
            type={this.state.coordType === 'percentages' ? 'primary' : 'default'}
            onClick={() => switchCoords('percentages')}
            size='small'>
              %
          </Button>
          <Button
            className={InspectorCSS['gesture-header-coord-btn']}
            type={this.state.coordType === 'pixels' ? 'primary' : 'default'}
            onClick={() => switchCoords('pixels')}
            size='small'>
              px
          </Button>
        </ButtonGroup>;

    const headerDescription =
      <Tooltip placement="topLeft" title='Edit'>
        <Input
          defaultValue={this.state.description}
          className={InspectorCSS['gesture-header-description']}
          onChange={(e) => {this.setState({description: e.target.value});}}
          size='small'/>
      </Tooltip>;

    const headerButtons =
      [
        <Tooltip title='Play'>
          <Button key="play" type="primary" icon={<PlayCircleOutlined />} onClick={() => this.onPlayGesture()} />
        </Tooltip>,
        <Button key="saveAs" onClick={() => this.onSaveAsGesture()}>Save As</Button>,
        <Button key="save" onClick={() => this.onSaveGesture()}>Save</Button>,
      ];

    const headerTitle =
      <Tooltip placement="topLeft" title='Edit'>
        <Input
          defaultValue={this.state.name}
          className={InspectorCSS['gesture-header-title']}
          onChange={(e) => {this.setState({name: e.target.value});}}
          size='small'/>
      </Tooltip>;

    const pageHeader =
      <PageHeader
        className={InspectorCSS['gesture-header']}
        onBack={() => this.onBacktoSaved()}
        title={headerTitle}
        extra={headerButtons}
        footer={
          <>
            <Row justify='space-between'>
              <Col>{headerDescription}</Col>
              <Col>{coordTypeBtns}</Col>
            </Row>
            <Divider/>
            {timeline}
          </>}
      />;

    return <>{pageHeader}{pageContent}</>;
  }
}

export default withTranslation(GestureEditor);