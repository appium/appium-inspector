import {IconPlus} from '@tabler/icons-react';
import {Button, Card, Space, Spin, Table} from 'antd';
import dayjs from 'dayjs';
import {useEffect} from 'react';
import {useTranslation} from 'react-i18next';

import {POINTER_TYPES, SAVED_GESTURES_TABLE_VALUES} from '../../../constants/gestures.js';
import {percentageToPixels} from '../../../utils/other.js';
import FileUploader from '../../FileUploader.jsx';
import SavedGestureActionsCell from './SavedGestureActionsCell.jsx';

import styles from './SavedGestures.module.css';

/**
 * Footer of the table listing the saved gestures.
 */
const SavedGesturesTableFooter = ({showGestureEditor, importGestureFiles}) => {
  const {t} = useTranslation();

  return (
    <Space.Compact style={{overflowX: 'scroll'}}>
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
    isUploadingGestureFiles,
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
    name: gesture.name || t('unnamed'),
    created: dayjs(gesture.date).format('YYYY-MM-DD'),
    description: gesture.description || t('No Description'),
    actions: (
      <SavedGestureActionsCell
        {...props}
        gesture={gesture}
        convertCoordinates={convertCoordinates}
        windowSize={windowSize}
      />
    ),
  }));

  const columns = [
    {
      title: t('Name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('Description'),
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: t('Created'),
      dataIndex: 'created',
      key: 'created',
      width: SAVED_GESTURES_TABLE_VALUES.DATE_COLUMN_WIDTH,
    },
    {
      title: t('Actions'),
      dataIndex: 'actions',
      key: 'actions',
      width: SAVED_GESTURES_TABLE_VALUES.ACTIONS_COLUMN_WIDTH,
    },
  ];

  useEffect(() => {
    getSavedGestures();
  }, [getSavedGestures]);

  return (
    <Card styles={{root: {height: '100%'}, body: {height: '100%', padding: '2px'}}}>
      <Spin spinning={isUploadingGestureFiles}>
        <Table
          className={styles.savedGesturesTable}
          styles={{
            root: {height: '100%'},
            header: {cell: {padding: '8px 16px'}},
            section: {height: 'calc(100% - 49px)'},
            body: {cell: {padding: '8px 16px'}},
            footer: {padding: '8px', borderTop: '1px solid var(--ant-table-border-color)', display: 'flex'},
          }}
          onRow={(row) => ({
            onMouseEnter: () => displayGestureWithID(row.key),
            onMouseLeave: () => removeGestureDisplay(),
          })}
          pagination={false}
          dataSource={dataSource}
          columns={columns}
          scroll={{x: '500px', y: 'calc(100% - 37px)'}}
          footer={() => (
            <SavedGesturesTableFooter showGestureEditor={showGestureEditor} importGestureFiles={importGestureFiles} />
          )}
        />
      </Spin>
    </Card>
  );
};

export default SavedGesturesTable;
