import {
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  HighlightOutlined,
  PlayCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {Button, Card, Popconfirm, Space, Spin, Table, Tooltip} from 'antd';
import dayjs from 'dayjs';
import _ from 'lodash';
import {useEffect} from 'react';

import {POINTER_TYPES, SAVED_GESTURE_PROPS} from '../../../constants/gestures.js';
import {SCREENSHOT_INTERACTION_MODE} from '../../../constants/screenshot.js';
import {downloadFile} from '../../../utils/file-handling.js';
import {percentageToPixels} from '../../../utils/other.js';
import FileUploader from '../../FileUploader.jsx';
import inspectorStyles from '../SessionInspector.module.css';

const dataSource = (savedGestures, t) => {
  if (!savedGestures) {
    return [];
  }
  return savedGestures.map((gesture) => ({
    key: gesture.id,
    Name: gesture.name || t('unnamed'),
    Created: dayjs(gesture.date).format('YYYY-MM-DD'),
    Description: gesture.description || t('No Description'),
  }));
};

const getGestureByID = (savedGestures, id, t) => {
  for (const gesture of savedGestures) {
    if (gesture.id === id) {
      return gesture;
    }
  }
  throw new Error(t('couldNotFindEntryWithId', {id}));
};

const SavedGestures = (props) => {
  const {
    savedGestures,
    showGestureEditor,
    displayGesture,
    removeGestureDisplay,
    getSavedGestures,
    isUploadingGestureFiles,
    importGestureFiles,
    t,
  } = props;

  const onRowMouseOver = (rowKey) => ({
    onMouseEnter: () => {
      const gesture = getGestureByID(savedGestures, rowKey, t);
      const pointers = convertCoordinates(gesture.actions);
      displayGesture(pointers);
    },
    onMouseLeave: () => {
      removeGestureDisplay();
    },
  });

  const loadSavedGesture = (gesture) => {
    const {setLoadedGesture} = props;
    setLoadedGesture(gesture);
    showGestureEditor();
  };

  const handleDelete = (id) => {
    const {deleteSavedGesture} = props;
    removeGestureDisplay();
    deleteSavedGesture(id);
  };

  const handleDownload = (gesture) => {
    const href = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(gesture, null, 2),
    )}`;
    const fileName = `gesture-${gesture.name.replace(' ', '-')}.json`;
    downloadFile(href, fileName);
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

  const columns = Object.keys(SAVED_GESTURE_PROPS).map((key) => {
    if (SAVED_GESTURE_PROPS[key] === SAVED_GESTURE_PROPS.ACTIONS) {
      return {
        title: t(SAVED_GESTURE_PROPS[key]),
        key: SAVED_GESTURE_PROPS[key],
        render: (_, record) => {
          const gesture = getGestureByID(savedGestures, record.key, t);
          return (
            <Space.Compact>
              <Tooltip zIndex={3} title={t('Play')}>
                <Button
                  key="play"
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={() => onPlay(gesture)}
                />
              </Tooltip>
              <Tooltip zIndex={3} title={t('Edit')}>
                <Button icon={<EditOutlined />} onClick={() => loadSavedGesture(gesture)} />
              </Tooltip>
              <Tooltip zIndex={3} title={t('Export to File')}>
                <Button icon={<ExportOutlined />} onClick={() => handleDownload(gesture)} />
              </Tooltip>
              <Tooltip zIndex={3} title={t('Delete')}>
                <Popconfirm
                  zIndex={4}
                  title={t('confirmDeletion')}
                  placement="topRight"
                  okText={t('OK')}
                  cancelText={t('Cancel')}
                  onConfirm={() => handleDelete(gesture.id)}
                >
                  <Button icon={<DeleteOutlined />} />
                </Popconfirm>
              </Tooltip>
            </Space.Compact>
          );
        },
      };
    } else {
      return {
        title: t(SAVED_GESTURE_PROPS[key]),
        dataIndex: SAVED_GESTURE_PROPS[key],
        key: SAVED_GESTURE_PROPS[key],
      };
    }
  });

  useEffect(() => {
    getSavedGestures();
  }, [getSavedGestures]);

  return (
    <Card
      title={
        <span>
          <HighlightOutlined /> {t('Saved Gestures')}
        </span>
      }
      className={inspectorStyles.interactionTabCard}
    >
      <Space className={inspectorStyles.spaceContainer} orientation="vertical" size="middle">
        {t('gesturesDescription')}
        <Spin spinning={isUploadingGestureFiles}>
          <Table
            onRow={(row) => onRowMouseOver(row.key)}
            pagination={false}
            dataSource={dataSource(savedGestures, t)}
            columns={columns}
            scroll={{y: 'calc(100vh - 32em)'}}
            footer={() => (
              <Space.Compact>
                <Button onClick={showGestureEditor} icon={<PlusOutlined />}>
                  {t('Create New Gesture')}
                </Button>
                <FileUploader
                  title={t('Import from File')}
                  onUpload={importGestureFiles}
                  multiple={true}
                  type="application/json"
                />
              </Space.Compact>
            )}
          />
        </Spin>
      </Space>
    </Card>
  );
};

export default SavedGestures;
