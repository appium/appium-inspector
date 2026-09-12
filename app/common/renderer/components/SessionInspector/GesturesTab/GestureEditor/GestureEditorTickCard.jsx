import {IconFocus2, IconGripVertical, IconX} from '@tabler/icons-react';
import {Button, Card, Tooltip} from 'antd';
import {useTranslation} from 'react-i18next';

import {POINTER_TYPES} from '../../../../constants/gestures.js';

import styles from './GestureEditor.module.css';

const deleteTick = (pointerKey, tickKey, pointers, setPointers, unselectTick) => {
  const copiedPointers = structuredClone(pointers);
  const currentPointer = copiedPointers.find((pointer) => pointer.id === pointerKey);
  const ticksToKeep = currentPointer.ticks.filter((tick) => tick.id !== tickKey);
  const newTicks = ticksToKeep.map((tick, index) => {
    const id = String(index + 1);
    if (tick.id !== id) {
      tick.id = `${tick.id[0]}.${id}`;
    }
    return tick;
  });
  currentPointer.ticks = newTicks;
  unselectTick();
  setPointers(copiedPointers);
};

/**
 * Tick card action buttons for toggling the coordinate picker and deleting the tick.
 */
const GestureEditorTickCardHeaderButtons = ({tick, pointers, setPointers, selectedTick, selectTick, unselectTick}) => {
  const {t} = useTranslation();
  const togglePickerLabel = t('toggleMoveActionCoordPicker');
  const deleteLabel = t('Delete');

  return (
    <>
      {tick.type === POINTER_TYPES.POINTER_MOVE && (
        <Tooltip title={togglePickerLabel}>
          <Button
            aria-label={togglePickerLabel}
            size="small"
            type={selectedTick === tick.id ? 'primary' : 'text'}
            icon={<IconFocus2 size={18} />}
            onClick={() => (selectedTick === tick.id ? unselectTick() : selectTick(tick.id))}
          />
        </Tooltip>
      )}
      <Tooltip title={deleteLabel}>
        <Button
          aria-label={deleteLabel}
          size="small"
          type="text"
          icon={<IconX size={18} />}
          onClick={() => deleteTick(tick.id[0], tick.id, pointers, setPointers, unselectTick)}
        />
      </Tooltip>
    </>
  );
};

/**
 * Wrapper card for a single tick in the gesture editor.
 */
const GestureEditorTickCard = ({
  children,
  tick,
  dragHandleRef,
  dragDisabled,
  isDropTarget,
  pointers,
  setPointers,
  selectedTick,
  selectTick,
  unselectTick,
}) => {
  const {t} = useTranslation();
  const dragLabel = t('dragGestureAction', {id: tick.id});

  return (
    <Card
      hoverable={true}
      className={styles.tickCard}
      data-drop-target={isDropTarget || undefined}
      title={
        <Tooltip title={dragLabel}>
          <Button
            ref={dragHandleRef}
            aria-label={dragLabel}
            className={styles.tickDragHandle}
            size="small"
            type="text"
            disabled={dragDisabled}
            icon={<IconGripVertical size={18} />}
          />
        </Tooltip>
      }
      extra={
        <GestureEditorTickCardHeaderButtons
          tick={tick}
          pointers={pointers}
          setPointers={setPointers}
          selectedTick={selectedTick}
          selectTick={selectTick}
          unselectTick={unselectTick}
        />
      }
    >
      {children}
    </Card>
  );
};

export default GestureEditorTickCard;
