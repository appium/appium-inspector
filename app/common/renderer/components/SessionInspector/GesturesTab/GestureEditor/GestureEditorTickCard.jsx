import {IconFocus2, IconX} from '@tabler/icons-react';
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
const GestureEditorTickCardHeaderButtons = ({
  tick,
  pointers,
  setPointers,
  selectedTick,
  selectTick,
  unselectTick,
}) => {
  const {t} = useTranslation();

  return (
    <>
      {tick.type === POINTER_TYPES.POINTER_MOVE && (
        <Tooltip title={t('toggleMoveActionCoordPicker')}>
          <Button
            aria-label={t('toggleMoveActionCoordPicker')}
            size="small"
            type={selectedTick === tick.id ? 'primary' : 'text'}
            icon={<IconFocus2 size={18} />}
            onClick={() => (selectedTick === tick.id ? unselectTick() : selectTick(tick.id))}
          />
        </Tooltip>
      )}
      <Tooltip title={t('Delete')}>
        <Button
          aria-label={t('Delete')}
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
  pointers,
  setPointers,
  selectedTick,
  selectTick,
  unselectTick,
}) => (
  <Card
    hoverable={true}
    className={styles.tickCard}
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
