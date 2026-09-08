import {IconArrowLeft, IconArrowRight, IconFocus2, IconX} from '@tabler/icons-react';
import {Button, Card, Tooltip} from 'antd';
import {useTranslation} from 'react-i18next';

import {POINTER_TYPES} from '../../../../constants/gestures.js';
import {moveGestureTick} from '../../../../utils/gesture-editing.js';

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

const GestureEditorTickMoveButton = ({tick, pointers, setPointers, unselectTick, direction}) => {
  const {t} = useTranslation();
  const pointer = pointers.find(({ticks}) => ticks.includes(tick));
  const index = pointer?.ticks.indexOf(tick) ?? -1;
  const targetIndex = index + direction;
  const label = t(direction < 0 ? 'moveGestureActionEarlier' : 'moveGestureActionLater');

  const moveTick = () => {
    const updatedPointers = moveGestureTick(pointers, pointer.id, tick.id, direction);
    if (updatedPointers !== pointers) {
      // The coordinate picker uses position-based IDs, so clear it before renumbering.
      unselectTick();
      setPointers(updatedPointers);
    }
  };

  return (
    <Tooltip title={label}>
      <Button
        aria-label={label}
        size="small"
        type="text"
        icon={direction < 0 ? <IconArrowLeft size={18} /> : <IconArrowRight size={18} />}
        disabled={index < 0 || targetIndex < 0 || targetIndex >= pointer.ticks.length}
        onClick={moveTick}
      />
    </Tooltip>
  );
};

/**
 * Wrapper card for a single tick in the gesture editor.
 */
const GestureEditorTickCard = ({children, tick, pointers, setPointers, selectedTick, selectTick, unselectTick}) => (
  <Card
    hoverable={true}
    className={styles.tickCard}
    actions={[-1, 1].map((direction) => (
      <GestureEditorTickMoveButton
        key={direction}
        tick={tick}
        pointers={pointers}
        setPointers={setPointers}
        unselectTick={unselectTick}
        direction={direction}
      />
    ))}
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

export default GestureEditorTickCard;
