import React, { Component } from 'react';
import { Table, Button, Tooltip } from 'antd';
import { withTranslation } from '../../util';
import moment from 'moment';
import { EditOutlined, DeleteOutlined, PlusOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { SCREENSHOT_INTERACTION_MODE, POINTER_TYPES } from './shared';

const SAVED_ACTIONS_OBJ = {NAME: 'Name', DESCRIPTION: 'Description', CREATED: 'Created', ACTIONS: 'Actions'};

class SavedGestures extends Component {

  constructor (props) {
    super(props);
    this.onRow = this.onRow.bind(this);
    this.drawnGesture = null;
  }

  onRow (record) {
    return {
      onClick: () => {
        const gesture = this.getGestureByID(record.key);
        if (gesture.id === this.drawnGesture) {
          this.props.removeGestureDisplay();
          this.drawnGesture = null;
        } else {
          this.onDraw(gesture);
          this.drawnGesture = gesture.id;
        }
      }
    };
  }

  componentDidMount () {
    const {getSavedGestures} = this.props;
    getSavedGestures();
  }

  componentWillUnmount () {
    this.drawnGesture = null;
  }

  loadSavedGesture (gesture) {
    const {removeGestureDisplay, setLoadedGesture, showGestureEditor} = this.props;
    removeGestureDisplay();
    setLoadedGesture(gesture);
    showGestureEditor();
  }

  handleDelete (id) {
    return () => {
      if (window.confirm('Are you sure?')) {
        this.props.deleteSavedGesture(id);
      }
    };
  }

  getGestureByID (id) {
    const {savedGestures} = this.props;
    for (let gesture of savedGestures) {
      if (gesture.id === id) {
        return gesture;
      }
    }
    throw new Error(`Couldn't find session with id ${id}`);
  }

  onDraw (gesture) {
    const {displayGesture} = this.props;
    const pointers = this.convertCoordinates(gesture.actions);
    displayGesture(pointers);
  }

  onPlay (gesture) {
    const {applyClientMethod} = this.props;
    const pointers = this.convertCoordinates(gesture.actions);
    const actions = this.formatGesture(pointers);
    applyClientMethod({methodName: SCREENSHOT_INTERACTION_MODE.GESTURE, args: [actions]});
  }

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

  convertCoordinates (pointers) {
    const newPointers = JSON.parse(JSON.stringify(pointers));
    newPointers.map((pointer) => {
      (pointer.ticks).map((tick) => {
        if (tick.type === POINTER_TYPES.POINTER_MOVE) {
          tick.x = this.percentageToPixels(tick.x, true);
          tick.y = this.percentageToPixels(tick.y, false);
        }
        return tick;
      });
      return pointer;
    });
    return newPointers;
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

  render () {

    const {savedGestures, showGestureEditor, t} = this.props;

    const dataSource = () => {
      if (savedGestures) {
        return savedGestures.map((gesture) => ({
          key: gesture.id,
          Name: (gesture.name || '(Unnamed)'),
          Created: moment(gesture.date).format('YYYY-MM-DD'),
          Description: gesture.description || 'No Description',
        }));
      } else {
        return [];
      }
    };

    const columns = (Object.keys(SAVED_ACTIONS_OBJ)).map((key) => {
      if (SAVED_ACTIONS_OBJ[key] === SAVED_ACTIONS_OBJ.ACTIONS) {
        return {title: SAVED_ACTIONS_OBJ[key], key: SAVED_ACTIONS_OBJ[key], render: (_, record) => {
          const gesture = this.getGestureByID(record.key);
          return (
            <div>
              <Tooltip title={t('Play')}>
                <Button key='play' type='primary' icon={<PlayCircleOutlined />} onClick={() => this.onPlay(gesture)}/>
              </Tooltip>
              <Button
                icon={<EditOutlined/>}
                onClick={() => this.loadSavedGesture(gesture)}
              />
              <Button
                icon={<DeleteOutlined/>}
                onClick={this.handleDelete(gesture.id)}/>
            </div>
          );
        }};
      } else {
        return {title: SAVED_ACTIONS_OBJ[key], dataIndex: SAVED_ACTIONS_OBJ[key], key: SAVED_ACTIONS_OBJ[key]};
      }
    });

    return <Table
      onRow={this.onRow}
      pagination={false}
      dataSource={dataSource()}
      columns={columns}
      footer={() => <Button
        onClick={showGestureEditor}
        icon={<PlusOutlined/>}
      />}
    />;
  }
}

export default withTranslation(SavedGestures);