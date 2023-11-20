import {DeleteOutlined, EditOutlined, PlayCircleOutlined, PlusOutlined} from '@ant-design/icons';
import {Button, Space, Table, Tooltip} from 'antd';
import _ from 'lodash';
import moment from 'moment';
import React, {useEffect, useRef} from 'react';

import InspectorStyles from './Inspector.css';
import {POINTER_TYPES, SCREENSHOT_INTERACTION_MODE, percentageToPixels} from './shared';

const SAVED_ACTIONS_OBJ = {
  NAME: 'Name',
  DESCRIPTION: 'Description',
  CREATED: 'Created',
  ACTIONS: 'Actions',
};

const SavedGestures = (props) => {
  const {savedGestures, showGestureEditor, removeGestureDisplay, t} = props;

  const drawnGestureRef = useRef(null);

  const onRowClick = (rowKey) => {
    const gesture = getGestureByID(rowKey);
    if (gesture.id === drawnGestureRef.current) {
      removeGestureDisplay();
      drawnGestureRef.current = null;
    } else {
      onDraw(gesture);
      drawnGestureRef.current = gesture.id;
    }
  };

  const loadSavedGesture = (gesture) => {
    const {setLoadedGesture} = props;
    removeGestureDisplay();
    setLoadedGesture(gesture);
    showGestureEditor();
  };

  const handleDelete = (id) => {
    const {deleteSavedGesture} = props;
    if (window.confirm('Are you sure?')) {
      deleteSavedGesture(id);
    }
  };

  const getGestureByID = (id) => {
    for (const gesture of savedGestures) {
      if (gesture.id === id) {
        return gesture;
      }
    }
    throw new Error(`Couldn't find session with id ${id}`);
  };

  const onDraw = (gesture) => {
    const {displayGesture} = props;
    const pointers = convertCoordinates(gesture.actions);
    displayGesture(pointers);
  };

  const onPlay = (gesture) => {
    const {applyClientMethod} = props;
    const pointers = convertCoordinates(gesture.actions);
    const actions = formatGesture(pointers);
    applyClientMethod({methodName: SCREENSHOT_INTERACTION_MODE.GESTURE, args: [actions]});
  };

  const formatGesture = (pointers) => {
    const actions = {};
    for (const pointer of pointers) {
      actions[pointer.name] = pointer.ticks.map((tick) => _.omit(tick, 'id'));
    }
    return actions;
  };

  const convertCoordinates = (pointers) => {
    const {windowSize} = props;
    const newPointers = JSON.parse(JSON.stringify(pointers));
    for (const pointer of newPointers) {
      for (const tick of pointer.ticks) {
        if (tick.type === POINTER_TYPES.POINTER_MOVE) {
          tick.x = percentageToPixels(tick.x, windowSize.width);
          tick.y = percentageToPixels(tick.y, windowSize.height);
        }
      }
    }
    return newPointers;
  };

  const dataSource = () => {
    if (!savedGestures) {
      return [];
    }
    return savedGestures.map((gesture) => ({
      key: gesture.id,
      Name: gesture.name || '(Unnamed)',
      Created: moment(gesture.date).format('YYYY-MM-DD'),
      Description: gesture.description || 'No Description',
    }));
  };

  const columns = Object.keys(SAVED_ACTIONS_OBJ).map((key) => {
    if (SAVED_ACTIONS_OBJ[key] === SAVED_ACTIONS_OBJ.ACTIONS) {
      return {
        title: SAVED_ACTIONS_OBJ[key],
        key: SAVED_ACTIONS_OBJ[key],
        render: (_, record) => {
          const gesture = getGestureByID(record.key);
          return (
            <Button.Group>
              <Tooltip title={t('Play')}>
                <Button
                  key="play"
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={() => onPlay(gesture)}
                />
              </Tooltip>
              <Button icon={<EditOutlined />} onClick={() => loadSavedGesture(gesture)} />
              <Button icon={<DeleteOutlined />} onClick={() => handleDelete(gesture.id)} />
            </Button.Group>
          );
        },
      };
    } else {
      return {
        title: SAVED_ACTIONS_OBJ[key],
        dataIndex: SAVED_ACTIONS_OBJ[key],
        key: SAVED_ACTIONS_OBJ[key],
      };
    }
  });

  useEffect(() => {
    const {getSavedGestures} = props;
    getSavedGestures();
    return () => (drawnGestureRef.current = null);
  }, []);

  return (
    <Space className={InspectorStyles.spaceContainer} direction="vertical" size="middle">
      {t('gesturesDescription')}
      <Table
        onRow={(row) => ({onClick: () => onRowClick(row.key)})}
        pagination={false}
        dataSource={dataSource()}
        columns={columns}
        footer={() => <Button onClick={showGestureEditor} icon={<PlusOutlined />} />}
      />
    </Space>
  );
};

export default SavedGestures;
