import React, { Component } from 'react';
import { Input, Button } from 'antd';
import { withTranslation } from '../../util';
import formatJSON from 'format-json';

const {TextArea} = Input;

class GestureEditor extends Component {

  constructor (props) {
    super(props);
    this.state = {
      name: null,
      description: null,
      pointer1: null,
      ticks1: null,
      pointer2: null,
      ticks2: null,
      pointer3: null,
      ticks3: null,
      pointer4: null,
      ticks4: null,
      pointer5: null,
      ticks5: null,
    };
  }

  onSave () {
    const {saveGesture, hideGestureEditor} = this.props;
    const {name, description, pointer1, ticks1, pointer2, ticks2,
           pointer3, ticks3, pointer4, ticks4, pointer5, ticks5} = this.state;
    const gesture = {
      name,
      description,
      actions: {},
    };
    gesture.actions[pointer1] = JSON.parse(JSON.stringify(ticks1));
    gesture.actions[pointer2] = JSON.parse(JSON.stringify(ticks2));
    gesture.actions[pointer3] = JSON.parse(JSON.stringify(ticks3));
    gesture.actions[pointer4] = JSON.parse(JSON.stringify(ticks4));
    gesture.actions[pointer5] = JSON.parse(JSON.stringify(ticks5));
    saveGesture(gesture);
    hideGestureEditor();
  }

  render () {
    console.log(this.state);

    const {loadedGesture} = this.props;

    const actionsIntoArr = loadedGesture ?
      Object.keys(loadedGesture.actions).map(
        (key) => [String(key), (formatJSON.plain(loadedGesture.actions[String(key)]))])
      :
      [];

    // console.log('ACTIONS:', actionsIntoArr, loadedGesture);

    return <>
      <Input placeholder="Name" onChange={(e) => this.setState({ name: e.target.value })} defaultValue={loadedGesture ? loadedGesture.name : ''}/>
      <Input placeholder="Description" onChange={(e) => this.setState({ description: e.target.value })} defaultValue={loadedGesture ? loadedGesture.description : ''}/>
      <Input placeholder="Finger Name" onChange={(e) => this.setState({ pointer1: e.target.value })} defaultValue={loadedGesture ? actionsIntoArr[0][0] : ''}/>
      <TextArea rows={4} placeholder="Ticks" onChange={(e) => this.setState({ ticks1: e.target.value })} defaultValue={loadedGesture ? actionsIntoArr[0][1] : ''}/>
      <Input placeholder="Finger Name" onChange={(e) => this.setState({ pointer2: e.target.value })} defaultValue={loadedGesture ? actionsIntoArr[1][0] : ''}/>
      <TextArea rows={4} placeholder="Ticks" onChange={(e) => this.setState({ ticks2: e.target.value })} defaultValue={loadedGesture ? actionsIntoArr[1][1] : ''}/>
      <Input placeholder="Finger Name" onChange={(e) => this.setState({ pointer3: e.target.value })} defaultValue={loadedGesture ? actionsIntoArr[2][0] : ''}/>
      <TextArea rows={4} placeholder="Ticks" onChange={(e) => this.setState({ ticks3: e.target.value })} defaultValue={loadedGesture ? actionsIntoArr[2][1] : ''}/>
      <Input placeholder="Finger Name" onChange={(e) => this.setState({ pointer4: e.target.value })} defaultValue={loadedGesture ? actionsIntoArr[3][0] : ''}/>
      <TextArea rows={4} placeholder="Ticks" onChange={(e) => this.setState({ ticks4: e.target.value })} defaultValue={loadedGesture ? actionsIntoArr[3][1] : ''}/>
      <Input placeholder="Finger Name" onChange={(e) => this.setState({ pointer5: e.target.value })} defaultValue={loadedGesture ? actionsIntoArr[4][0] : ''}/>
      <TextArea rows={4} placeholder="Ticks" onChange={(e) => this.setState({ ticks5: e.target.value })} defaultValue={loadedGesture ? actionsIntoArr[4][1] : ''}/>
      <Button type="primary">Play</Button>
      <Button type="primary" onClick={() => this.onSave()}>Submit</Button>
    </>;
  }
}

export default withTranslation(GestureEditor);



// Ex: msg to appium
// applyClientMethod({
//   methodName: GESTURE,
//   args: [{
//     pointer1: [
//       {type: 'pointerMove', duration: 0, x: 150, y: 200},
//       {type: 'pointerDown', button: 0},
//       {type: 'pause', duration: 100},
//       {type: 'pointerUp', button: 0}
//     ],
//     pointer2: [
//       {type: 'pointerMove', duration: 0, x: 150, y: 100},
//       {type: 'pointerDown', button: 0},
//       {type: 'pause', duration: 100},
//       {type: 'pointerUp', button: 0}
//     ],
//     pointer3: [
//       {type: 'pointerMove', duration: 0, x: 150, y: 100},
//       {type: 'pointerDown', button: 0},
//       {type: 'pause', duration: 100},
//       {type: 'pointerUp', button: 0}
//     ],
//     pointer4: [
//       {type: 'pointerMove', duration: 0, x: 150, y: 100},
//       {type: 'pointerDown', button: 0},
//       {type: 'pause', duration: 100},
//       {type: 'pointerUp', button: 0}
//     ],
//     pointer5: [
//       {type: 'pointerMove', duration: 0, x: 150, y: 100},
//       {type: 'pointerDown', button: 0},
//       {type: 'pause', duration: 100},
//       {type: 'pointerUp', button: 0}
//     ],
//   }],
// });