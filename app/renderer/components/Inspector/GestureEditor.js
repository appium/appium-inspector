import React, { Component } from 'react';
import { Tabs, Input, Button, Card, Select, Row, Col, PageHeader, Space } from 'antd';
import { PlayCircleOutlined, PlusCircleOutlined, CloseOutlined } from '@ant-design/icons';
import { withTranslation } from '../../util';
import InspectorCSS from './Inspector.css';

const { TabPane } = Tabs;
const { Option } = Select;

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
      gesture.actions[obj.title] = Object.keys(obj.content).map((key) => obj.content[key]);
    });

    if (saveAs) {
      gesture.id = null;
      gesture.date = null;
    }

    return gesture;
  }

  onSaveGesture () {
    const {saveGesture, hideGestureEditor, unsetLoadedGesture, undrawGesture} = this.props;
    const gesture = this.formatGesture();
    saveGesture(gesture);
    hideGestureEditor();
    unsetLoadedGesture();
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

    applyClientMethod({methodName: 'gesture', args: [actions]});
  }

  onDrawGesture () {
    const {drawGesture} = this.props;
    const gesture = this.formatGesture();

    drawGesture(gesture);
  }

  onBacktoSaved () {
    const {hideGestureEditor, unsetLoadedGesture, undrawGesture} = this.props;
    hideGestureEditor();
    unsetLoadedGesture();
    undrawGesture();
  }

  render () {

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

    const tickOptions = <>
      <Option value="pointerMove" key='pointerMove'>pointerMove</Option>
      <Option value="pointerDown" key='pointerDown'>pointerDown</Option>
      <Option value="pointerUp" key='pointerUp'>pointerUp</Option>
      <Option value="pause" key='pause'>pause</Option>
    </>;

    const checkItem = (pointerKey, tickKey) => this.state.pointers.filter((pointer) => pointer.key === pointerKey)[0].content[tickKey].type;

    const editTick = (pointerKey, tickKey, index) =>
      <Card key={tickKey} extra={<Button size='small' type='text' icon={<CloseOutlined />} onClick={() => deleteTick(pointerKey, tickKey)} />} headStyle={{ marginTop: '-16px', paddingRight: '0px', borderBottom:'none'}} bodyStyle={{ marginTop: '-30px', minHeight:'200px'}}>
        <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
          <center><Select placeholder='Pointer Type' defaultValue={this.state.pointers[index].content[tickKey].type} size='middle' dropdownMatchSelectWidth={false} onChange={(e) => editTickOptions(pointerKey, tickKey, 'Pointer Type', e)}>{tickOptions}</Select></center>
          {(checkItem(pointerKey, tickKey) === 'pointerMove' || checkItem(pointerKey, tickKey) === 'pause') && <Input placeholder="Duration" defaultValue={this.state.pointers[index].content[tickKey].duration} onChange={(e) => editTickOptions(pointerKey, tickKey, 'Duration', e.target.value)}/>}
          {(checkItem(pointerKey, tickKey) === 'pointerDown' || checkItem(pointerKey, tickKey) === 'pointerUp') && <Input placeholder="Button" defaultValue={this.state.pointers[index].content[tickKey].button} onChange={(e) => editTickOptions(pointerKey, tickKey, 'Button', e.target.value)}/>}
          {checkItem(pointerKey, tickKey) === 'pointerMove' && <Input placeholder="X" defaultValue={this.state.pointers[index].content[tickKey].x} onChange={(e) => editTickOptions(pointerKey, tickKey, 'X', e.target.value)}/>}
          {checkItem(pointerKey, tickKey) === 'pointerMove' && <Input placeholder="Y" defaultValue={this.state.pointers[index].content[tickKey].y} onChange={(e) => editTickOptions(pointerKey, tickKey, 'Y', e.target.value)}/>}
        </Space>
      </Card>;

    return <><PageHeader
      className={InspectorCSS['gesture-header']}
      onBack={() => this.onBacktoSaved()}
      title={<Input defaultValue={this.state.name} style={{ fontSize: '20px', fontWeight: '500'}} onChange={(e) => {this.setState({name: e.target.value});}} size='small'/>}
      extra={[
        <Button key="play" type="primary" icon={<PlayCircleOutlined />} onClick={() => this.onPlayGesture()}></Button>,
        <Button key="saveAs" onClick={() => this.onSaveAsGesture()}>Save As</Button>,
        <Button key="save" onClick={() => this.onSaveGesture()}>Save</Button>,
      ]}
      footer={<Input defaultValue={this.state.description} style={{ fontSize: '15px', fontWeight: '400', color: '#636363', marginLeft: '30px' }} onChange={(e) => {this.setState({description: e.target.value});}} size='small'/>}/>
    <Tabs type="editable-card" onChange={changePointer} activeKey={this.state.activeKey} onEdit={pointerAction} hideAdd={this.state.pointers.length === 5} centered={true} tabBarGutter={10} >
      {this.state.pointers.map((pointer, index) => (
        <TabPane tab={<Input style={{ maxWidth: '65px', padding: '0 0 0 0', textAlign: 'center' }} defaultValue={pointer.title} bordered={false} maxLength={10} onChange={(e) => {pointer.title = e.target.value; this.setState({pointers: this.state.pointers});}}/>} key={pointer.key}>
          <Row gutter={[24, 24]}>
            {Object.keys(pointer.content).map((key) => <Col span={6}><div>{editTick(pointer.key, key, index)}</div></Col>)}
            <Col span={6}><Row justify='center'><Button icon={<PlusCircleOutlined />} onClick={() => addTick(pointer.key)} key="add"></Button></Row></Col>
          </Row>
        </TabPane>
      ))}
    </Tabs>
    </>;
  }
}

export default withTranslation(GestureEditor);