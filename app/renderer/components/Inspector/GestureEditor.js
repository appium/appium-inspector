import React, { Component } from 'react';
import { Tabs, Input, Button, Card, Select, Row, Col, PageHeader, Space, Steps, Divider, Typography, Tooltip, Popover } from 'antd';
import { PlayCircleOutlined, PlusCircleOutlined, CloseOutlined, AimOutlined, RightCircleOutlined, DownCircleOutlined, UpCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';
import { withTranslation } from '../../util';
import InspectorCSS from './Inspector.css';
const { Title } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const ButtonGroup = Button.Group;
const {Step} = Steps;

const DEFAULT_POINTERS = () => Array.from({ length: 1 }).map((_, index) => {
  const id = String(index + 1);
  return { title: `pointer${id}`, content: {'1.1': {}}, key: id};
});

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
      activeKey: '1',
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
        if (actions[pointerName][i].type === 'pointerMove') {
          content[`${counter}.${i + 1}`] = actions[pointerName][i];
          content[`${counter}.${i + 1}`].pixelX = true;
          content[`${counter}.${i + 1}`].pixelY = true;
        } else {
          content[`${counter}.${i + 1}`] = actions[pointerName][i];
        }
      }
      return { title: pointerName, key: String(counter), content};
    });

    return pointers;

  }

  formatGesture (saveAs) {
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
          return {type: obj.content[key].type, duration: Number(obj.content[key].duration), x: obj.content[key].pixelX ? obj.content[key].x : this.percentageToPixels(obj.content[key].x, true), y: obj.content[key].pixelY ? obj.content[key].y : this.percentageToPixels(obj.content[key].y, false)};
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
    const gesture = this.formatGesture();
    saveGesture(gesture);
    hideGestureEditor();
    unsetLoadedGesture();
    unselectTick();
    undrawGesture();
  }

  onSaveAsGesture () {
    const {saveGesture, unsetLoadedGesture, undrawGesture} = this.props;
    const gesture = this.formatGesture(true);
    saveGesture(gesture);
    unsetLoadedGesture();
    undrawGesture();
  }

  onPlayGesture () {
    const {applyClientMethod} = this.props;
    const {actions} = this.formatGesture();

    console.log(actions);

    applyClientMethod({methodName: 'gesture', args: [actions]});
  }

  onDrawGesture () {
    const {drawGesture} = this.props;
    const gesture = this.formatGesture();

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
        return String(Math.round((intPixel / width) * 100));
      } else {
        return String(Math.round((intPixel / height) * 100));
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
      const { pointers } = this.state;
      const currentPointer = pointers.filter((pointer) => pointer.key === pointerKey)[0];
      const currentTick = currentPointer.content[tickKey];

      if (!currentTick.pixelX) {
        currentTick.x = this.pixelsToPercentage(x, true);
      } else {
        currentTick.x = x;
      }

      if (!currentTick.pixelY) {
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

    const changePointer = (newActiveKey) => {
      this.setState({activeKey: newActiveKey});
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
        }
      } else if (msg === 'Duration') {
        currentTick.duration = value;
      } else if (msg === 'Button') {
        currentTick.button = value;
      } else if (msg === 'X') {
        currentTick.x = value;
      } else if (msg === 'Y') {
        currentTick.y = value;
      } else if (msg === 'PixelX') {
        if (value !== currentTick.pixelX && value) {
          currentTick.x = this.percentageToPixels(currentTick.x, true);
        } else if (value !== currentTick.pixelX && !value) {
          currentTick.x = this.pixelsToPercentage(currentTick.x, true);
        }
        currentTick.pixelX = value;
      } else if (msg === 'PixelY') {
        if (value !== currentTick.pixelY && value) {
          currentTick.y = this.percentageToPixels(currentTick.y, false);
        } else if (value !== currentTick.pixelY && !value) {
          currentTick.y = this.pixelsToPercentage(currentTick.y, false);
        }
        currentTick.pixelY = value;
      }
      this.setState({pointers});
    };

    const tickOptions = <>
      <Option value="pointerMove" key='pointerMove'><center>pointerMove</center></Option>
      <Option value="pointerDown" key='pointerDown'><center>pointerDown</center></Option>
      <Option value="pointerUp" key='pointerUp'><center>pointerUp</center></Option>
      <Option value="pause" key='pause'><center>pause</center></Option>
    </>;

    const checkItem = (pointerKey, tickKey) => this.state.pointers.filter((pointer) => pointer.key === pointerKey)[0].content[tickKey].type;

    const getCurrentPointer = () => {
      const {activeKey, pointers} = this.state;
      const currentPointer = pointers.filter((pointer) => pointer.key === activeKey)[0];
      return currentPointer;
    };

    const editTick = (pointerKey, tickKey, index) =>
      <Card hoverable={true} key={tickKey} extra={
        <>{checkItem(pointerKey, tickKey) === 'pointerMove' &&
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
          </Tooltip>
        }
        <Button size='small' type='text' icon={<CloseOutlined />} onClick={() => deleteTick(pointerKey, tickKey)} />
        </>} headStyle={{ marginTop: '-16px', paddingRight: '0px', borderBottom: 'none'}} bodyStyle={{ marginTop: '-12px', minHeight: '220px', marginRight: '-12px'}}>
        <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
          <center><Select style={{width: '145px'}} placeholder='Pointer Type' defaultValue={this.state.pointers[index].content[tickKey].type} size='middle' dropdownMatchSelectWidth={false} onChange={(e) => editTickOptions(pointerKey, tickKey, 'Pointer Type', e)}>{tickOptions}</Select></center>
          <center>{(checkItem(pointerKey, tickKey) === 'pointerMove' || checkItem(pointerKey, tickKey) === 'pause') && <Input style={{width: '145px'}} placeholder="Duration" defaultValue={this.state.pointers[index].content[tickKey].duration} onChange={(e) => editTickOptions(pointerKey, tickKey, 'Duration', e.target.value)} addonAfter="ms"/>}</center>
          {(checkItem(pointerKey, tickKey) === 'pointerDown' || checkItem(pointerKey, tickKey) === 'pointerUp') &&
            <center><ButtonGroup style={{marginTop: '-18px', display: 'block'}}>
              <Button type={this.state.pointers[index].content[tickKey].button === 0 ? 'primary' : 'default'} style={{width: '73px'}} onClick={() => editTickOptions(pointerKey, tickKey, 'Button', 0)}>Left</Button>
              <Button type={this.state.pointers[index].content[tickKey].button === 1 ? 'primary' : 'default'} style={{width: '73px'}} onClick={() => editTickOptions(pointerKey, tickKey, 'Button', 1)}>Right</Button>
            </ButtonGroup></center>
          }
          <center>{checkItem(pointerKey, tickKey) === 'pointerMove' && <Input.Group compact><Input value={this.state.pointers[index].content[tickKey].x} style={{width: '58px'}} placeholder="X" defaultValue={this.state.pointers[index].content[tickKey].x} onChange={(e) => editTickOptions(pointerKey, tickKey, 'X', e.target.value)}/>
            <ButtonGroup>
              <Button type={this.state.pointers[index].content[tickKey].pixelX ? 'primary' : 'default'} onClick={() => editTickOptions(pointerKey, tickKey, 'PixelX', true)}>px</Button>
              <Button type={this.state.pointers[index].content[tickKey].pixelX ? 'default' : 'primary'} onClick={() => editTickOptions(pointerKey, tickKey, 'PixelX', false)}>%</Button>
            </ButtonGroup>
          </Input.Group>}</center>
          <center>{checkItem(pointerKey, tickKey) === 'pointerMove' && <Input.Group compact><Input value={this.state.pointers[index].content[tickKey].y} style={{width: '58px'}} placeholder="Y" defaultValue={this.state.pointers[index].content[tickKey].y} onChange={(e) => editTickOptions(pointerKey, tickKey, 'Y', e.target.value)}/>
            <ButtonGroup>
              <Button type={this.state.pointers[index].content[tickKey].pixelY ? 'primary' : 'default'} onClick={() => editTickOptions(pointerKey, tickKey, 'PixelY', true)}>px</Button>
              <Button type={this.state.pointers[index].content[tickKey].pixelY ? 'default' : 'primary'} onClick={() => editTickOptions(pointerKey, tickKey, 'PixelY', false)}>%</Button>
            </ButtonGroup>
          </Input.Group>}</center>
        </Space>
      </Card>;

    return <><PageHeader
      className={InspectorCSS['gesture-header']}
      onBack={() => this.onBacktoSaved()}
      title={<Tooltip placement="topLeft" title='Edit'><Input defaultValue={this.state.name} style={{ fontSize: '20px', fontWeight: '500'}} onChange={(e) => {this.setState({name: e.target.value});}} size='small'/></Tooltip>}
      extra={[
        <Tooltip title='Play'><Button key="play" type="primary" icon={<PlayCircleOutlined />} onClick={() => this.onPlayGesture()}></Button></Tooltip>,
        <Button key="saveAs" onClick={() => this.onSaveAsGesture()}>Save As</Button>,
        <Button key="save" onClick={() => this.onSaveGesture()}>Save</Button>,
      ]}
      footer={
        <>
          <Tooltip placement="topLeft" title='Edit'>
            <Input defaultValue={this.state.description} style={{ fontSize: '15px', fontWeight: '400', color: '#636363', marginLeft: '30px' }} onChange={(e) => {this.setState({description: e.target.value});}} size='small'/>
          </Tooltip>
          <Divider/>
          <Title style={{ fontSize: '15px', fontWeight: '500', marginLeft: '40px' }}>Timeline for {getCurrentPointer().title}:</Title>
          <center><Steps style={{width: '90%', marginTop: '20px'}}>{Object.keys(getCurrentPointer().content).map((tickKey) => {
            if (getCurrentPointer().content[tickKey].type === 'pointerMove') {
              return <Step status="finish" icon={<Popover placement='bottom' title={<center>{getCurrentPointer().content[tickKey].type}</center>} content={
                <div style={{textAlign: 'center'}}>
                  <p>Duration: {getCurrentPointer().content[tickKey].duration}ms</p>
                  <p>X: {getCurrentPointer().content[tickKey].x}{getCurrentPointer().content[tickKey].pixelX ? 'px' : '%'}</p>
                  <p>Y: {getCurrentPointer().content[tickKey].y}{getCurrentPointer().content[tickKey].pixelY ? 'px' : '%'}</p>
                </div>
              }><RightCircleOutlined /></Popover>} />;
            } else if (getCurrentPointer().content[tickKey].type === 'pointerDown') {
              return <Step status="finish" icon={<Popover placement='bottom' title={<center>{getCurrentPointer().content[tickKey].type}</center>} content={
                <div style={{textAlign: 'center'}}>
                  <p>Button: {getCurrentPointer().content[tickKey].button === 0 ? 'Left' : 'Right'}</p>
                </div>
              }><DownCircleOutlined /></Popover>}/>;
            } else if (getCurrentPointer().content[tickKey].type === 'pointerUp') {
              return <Step status="finish" icon={<Popover placement='bottom' title={<center>{getCurrentPointer().content[tickKey].type}</center>} content={
                <div style={{textAlign: 'center'}}>
                  <p>Button: {getCurrentPointer().content[tickKey].button === 0 ? 'Left' : 'Right'}</p>
                </div>
              }><UpCircleOutlined /></Popover>}/>;
            } else if (getCurrentPointer().content[tickKey].type === 'pause') {
              return <Step status="finish" icon={<Popover placement='bottom' title={<center>{getCurrentPointer().content[tickKey].type}</center>} content={
                <div style={{textAlign: 'center'}}>
                  <p>Duration: {getCurrentPointer().content[tickKey].duration}ms</p>
                </div>
              }><PauseCircleOutlined /></Popover>}/>;
            }
          })}
          </Steps></center>
          <div style={{height: '30px'}}></div>
        </>
      }/>
    <Tabs type="editable-card" onChange={changePointer} activeKey={this.state.activeKey} onEdit={pointerAction} hideAdd={this.state.pointers.length === 5} centered={true} tabBarGutter={10} >
      {this.state.pointers.map((pointer, index) => (
        <TabPane tab={<Tooltip title='Edit' mouseEnterDelay={1}><Input style={{ cursor: this.state.activeKey === pointer.key ? 'text' : 'pointer', maxWidth: '65px', padding: '0 0 0 0', textAlign: 'center' }} defaultValue={pointer.title} bordered={false} maxLength={10} onChange={(e) => {pointer.title = e.target.value; this.setState({pointers: this.state.pointers});}}/></Tooltip>} key={pointer.key}>
          <Row gutter={[24, 24]}>
            {Object.keys(pointer.content).map((key) => <Col xs={12} sm={12} md={12} lg={8} xl={6} xxl={4}><div>{editTick(pointer.key, key, index)}</div></Col>)}
            <Col xs={12} sm={12} md={12} lg={8} xl={6} xxl={4}><Card bordered={false} bodyStyle={{ minHeight: '220px'}}><center><Button style={{position: 'absolute', top: '40%'}} icon={<PlusCircleOutlined />} onClick={() => addTick(pointer.key)} key="add"></Button></center></Card></Col>
          </Row>
        </TabPane>
      ))}
    </Tabs>
    </>;
  }
}

export default withTranslation(GestureEditor);