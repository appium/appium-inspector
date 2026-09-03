import {IconEdit, IconFileExport, IconPlayerPlay, IconTrash} from '@tabler/icons-react';
import {Button, Popconfirm, Space, Tooltip} from 'antd';
import {useTranslation} from 'react-i18next';

import {SCREENSHOT_INTERACTION_MODE} from '../../../constants/screenshot.js';
import {omit} from '../../../utils/common.js';

/**
 * Final cell of each saved gestures row, containing gesture actions.
 */
const SavedGestureActionsCell = (props) => {
  const {
    gesture,
    showGestureEditor,
    removeGestureDisplay,
    exportSavedGesture,
    setLoadedGesture,
    deleteSavedGesture,
    convertCoordinates,
    windowSize,
    applyClientMethod,
  } = props;
  const {t} = useTranslation();
  const playLabel = t('Play');
  const editLabel = t('Edit');
  const exportLabel = t('Export to File');
  const deleteLabel = t('Delete');

  const playGesture = () => {
    const actions = {};
    for (const pointer of convertCoordinates(gesture.actions, windowSize)) {
      actions[pointer.name] = pointer.ticks.map((tick) => omit(tick, 'id'));
    }
    applyClientMethod({methodName: SCREENSHOT_INTERACTION_MODE.GESTURE, args: [actions]});
  };

  const loadGesture = () => {
    setLoadedGesture(gesture);
    showGestureEditor();
  };

  const deleteGesture = () => {
    removeGestureDisplay();
    deleteSavedGesture(gesture.id);
  };

  return (
    <Space.Compact>
      <Tooltip zIndex={3} title={playLabel}>
        <Button
          aria-label={playLabel}
          key="play"
          type="primary"
          icon={<IconPlayerPlay size={18} />}
          onClick={() => playGesture()}
        />
      </Tooltip>
      <Tooltip zIndex={3} title={editLabel}>
        <Button aria-label={editLabel} icon={<IconEdit size={18} />} onClick={() => loadGesture()} />
      </Tooltip>
      <Tooltip zIndex={3} title={exportLabel}>
        <Button
          aria-label={exportLabel}
          icon={<IconFileExport size={18} />}
          onClick={() => exportSavedGesture(gesture)}
        />
      </Tooltip>
      <Tooltip zIndex={3} title={deleteLabel}>
        <Popconfirm
          zIndex={4}
          title={t('confirmDeletion')}
          placement="topRight"
          okText={t('OK')}
          cancelText={t('Cancel')}
          onConfirm={() => deleteGesture()}
        >
          <Button aria-label={deleteLabel} icon={<IconTrash size={18} />} />
        </Popconfirm>
      </Tooltip>
    </Space.Compact>
  );
};

export default SavedGestureActionsCell;
