import {IconPlus} from '@tabler/icons-react';
import {Button, Space, Table} from 'antd';
import dayjs from 'dayjs';
import {useEffect} from 'react';
import {useTranslation} from 'react-i18next';

import {POINTER_TYPES, SAVED_GESTURE_PROPS} from '../../../constants/gestures.js';
import {percentageToPixels} from '../../../utils/other.js';
import FileUploader from '../../FileUploader.jsx';
import SavedGestureActionsCell from './SavedGestureActionsCell.jsx';

/**
 * Footer of the table listing the saved gestures.
 */
const SavedGesturesTableFooter = ({showGestureEditor, importGestureFiles}) => {
  const {t} = useTranslation();

  return (
    <Space.Compact>
      <Button onClick={showGestureEditor} icon={<IconPlus size={16} />}>
        {t('Create New Gesture')}
      </Button>
      <FileUploader
        title={t('Import from File')}
        onUpload={importGestureFiles}
        multiple={true}
        type="application/json"
      />
    </Space.Compact>
  );
};

const convertCoordinates = (pointers, windowSize) => {
  if (!windowSize?.width || !windowSize?.height) {
    return pointers;
  }
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

/**
 * Table listing the saved gestures.
 */
const SavedGesturesTable = (props) => {
  const {
    savedGestures,
    showGestureEditor,
    displayGesture,
    removeGestureDisplay,
    getSavedGestures,
    importGestureFiles,
    windowSize,
  } = props;
  const {t} = useTranslation();

  const displayGestureWithID = (id) => {
    const gesture = savedGestures.find((gesture) => gesture.id === id);
    if (gesture === undefined) {
      throw new Error(t('couldNotFindEntryWithId', {id}));
    }
    const pointers = convertCoordinates(gesture.actions, windowSize);
    displayGesture(pointers);
  };

  const dataSource = savedGestures.map((gesture) => ({
    key: gesture.id,
    Name: gesture.name || t('unnamed'),
    Created: dayjs(gesture.date).format('YYYY-MM-DD'),
    Description: gesture.description || t('No Description'),
    Actions: (
      <SavedGestureActionsCell
        {...props}
        gesture={gesture}
        convertCoordinates={convertCoordinates}
        windowSize={windowSize}
      />
    ),
  }));

  const columns = Object.keys(SAVED_GESTURE_PROPS).map((key) => ({
    title: t(SAVED_GESTURE_PROPS[key]),
    dataIndex: SAVED_GESTURE_PROPS[key],
    key: SAVED_GESTURE_PROPS[key],
  }));

  useEffect(() => {
    getSavedGestures();
  }, [getSavedGestures]);

  return (
    <Table
      onRow={(row) => ({
        onMouseEnter: () => displayGestureWithID(row.key),
        onMouseLeave: () => removeGestureDisplay(),
      })}
      pagination={false}
      dataSource={dataSource}
      columns={columns}
      scroll={{y: 'calc(100vh - 32em)'}}
      footer={() => (
        <SavedGesturesTableFooter
          showGestureEditor={showGestureEditor}
          importGestureFiles={importGestureFiles}
        />
      )}
    />
  );
};

export default SavedGesturesTable;
