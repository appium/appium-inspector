import {
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import {Button, Collapse, Modal, Row, Popconfirm, Space, Table, Tooltip} from 'antd';
import _ from 'lodash';
import moment from 'moment';
import React, {useEffect, useRef} from 'react';

import {POINTER_TYPES, SAVED_GESTURE_PROPS} from '../../constants/gestures';
import {SCREENSHOT_INTERACTION_MODE} from '../../constants/screenshot';
import {downloadFile, percentageToPixels} from '../../utils/other';
import InspectorStyles from './Inspector.module.css';
import FileUploader from './FileUploader.jsx';

const dataSource = (savedGestures, t) => {
  if (!savedGestures) {
    return [];
  }
  return savedGestures.map((gesture) => ({
    key: gesture.id,
    Name: gesture.name || t('unnamed'),
    Created: moment(gesture.date).format('YYYY-MM-DD'),
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
    deleteSavedGesture,
    showGestureEditor,
    setGestureUploadErrors,
    removeGestureDisplay,
    getSavedGestures,
    uploadGesturesFromFile,
    gestureUploadErrors,
    t,
  } = props;

  const drawnGestureRef = useRef(null);

  const onRowClick = (rowKey) => {
    const gesture = getGestureByID(savedGestures, rowKey, t);
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

  const handleDownload = (gesture) => {
    const href = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(gesture, null, 2),
    )}`;
    const fileName = `gesture-${gesture.name.replace(' ', '-')}.json`;
    downloadFile(href, fileName);
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

  const columns = Object.keys(SAVED_GESTURE_PROPS).map((key) => {
    if (SAVED_GESTURE_PROPS[key] === SAVED_GESTURE_PROPS.ACTIONS) {
      return {
        title: t(SAVED_GESTURE_PROPS[key]),
        key: SAVED_GESTURE_PROPS[key],
        render: (_, record) => {
          const gesture = getGestureByID(savedGestures, record.key, t);
          return (
            <Button.Group>
              <Tooltip zIndex={2} title={t('Play')}>
                <Button
                  key="play"
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={() => onPlay(gesture)}
                />
              </Tooltip>
              <Tooltip zIndex={2} title={t('Edit')}>
                <Button icon={<EditOutlined />} onClick={() => loadSavedGesture(gesture)} />
              </Tooltip>
              <Tooltip zIndex={2} title={t('Download')}>
                <Button icon={<DownloadOutlined />} onClick={() => handleDownload(gesture)} />
              </Tooltip>
              <Tooltip zIndex={2} title={t('Delete')}>
                <Popconfirm
                  zIndex={3}
                  title={t('confirmDeletion')}
                  placement="topRight"
                  okText={t('OK')}
                  cancelText={t('Cancel')}
                  onConfirm={() => deleteSavedGesture(gesture.id)}
                >
                  <Button icon={<DeleteOutlined />} />
                </Popconfirm>
              </Tooltip>
            </Button.Group>
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
    return () => (drawnGestureRef.current = null);
  }, []);
  return (
    <Space className={InspectorStyles.spaceContainer} direction="vertical" size="middle">
      {t('gesturesDescription')}
      <Table
        onRow={(row) => ({onClick: () => onRowClick(row.key)})}
        pagination={false}
        dataSource={dataSource(savedGestures, t)}
        columns={columns}
        footer={() => (
          <Button.Group>
            <Tooltip title={t('Create New Gesture')}>
              <Button onClick={showGestureEditor} icon={<PlusOutlined />} />
            </Tooltip>
            <FileUploader
              tooltipTitle={t('Upload Gesture File')}
              onUpload={uploadGesturesFromFile}
              multiple={true}
              type="application/json"
            />
          </Button.Group>
        )}
      />
      {gestureUploadErrors && (
        <Modal
          title={
            <Row align="start">
              <ExclamationCircleOutlined className={InspectorStyles['error-icon']} />{' '}
              {t('errorLoadingGestures')}
            </Row>
          }
          open={!!gestureUploadErrors}
          footer={null} // we dont need ok and cancel buttons
          onCancel={() => setGestureUploadErrors(null)}
        >
          <p>
            <i>{t('unableToUploadGestureFiles')}</i>
          </p>
          <Collapse ghost defaultActiveKey={Object.keys(gestureUploadErrors)}>
            {Object.keys(gestureUploadErrors).map((errorFile) => (
              <Collapse.Panel header={<b>{errorFile}</b>} key={errorFile}>
                <ol>
                  {gestureUploadErrors[errorFile].map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ol>
              </Collapse.Panel>
            ))}
          </Collapse>
        </Modal>
      )}
    </Space>
  );
};

export default SavedGestures;
