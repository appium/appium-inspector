import {Feedback} from '@dnd-kit/dom';
import {SortableKeyboardPlugin} from '@dnd-kit/dom/sortable';
import {DragDropProvider} from '@dnd-kit/react';
import {isSortable, useSortable} from '@dnd-kit/react/sortable';
import {IconPlus} from '@tabler/icons-react';
import {Button, Col, Row, Tooltip} from 'antd';
import {useTranslation} from 'react-i18next';

import {moveGestureTick} from '../../../../utils/gesture-editing.js';
import GestureEditorTickCard from './GestureEditorTickCard.jsx';
import GestureEditorTickCardContents from './GestureEditorTickCardContents.jsx';

import styles from './GestureEditor.module.css';

const addTick = (pointerKey, pointers, setPointers) => {
  const copiedPointers = structuredClone(pointers);
  const currentPointer = copiedPointers.find((pointer) => pointer.id === pointerKey);
  const id = `${pointerKey}.${currentPointer.ticks.length + 1}`;
  currentPointer.ticks.push({id});
  setPointers(copiedPointers);
};

/**
 * Button to add a new pointer tick.
 */
const AddNewTickButton = ({id, pointers, setPointers}) => {
  const {t} = useTranslation();
  const addLabel = t('Add');

  return (
    <div className={styles.tickPlusBtnWrapper}>
      <Tooltip title={addLabel}>
        <Button
          aria-label={addLabel}
          icon={<IconPlus size={18} />}
          onClick={() => addTick(id, pointers, setPointers)}
        />
      </Tooltip>
    </div>
  );
};

/**
 * Single tick in a pointer.
 */
const GestureEditorTick = ({
  tick,
  index,
  pointer,
  pointers,
  setPointers,
  selectedTick,
  selectTick,
  unselectTick,
  getDefaultMoveDuration,
}) => {
  const {ref, handleRef, isDropTarget} = useSortable({
    id: tick.id,
    index,
    group: pointer.id,
    disabled: pointer.ticks.length < 2,
    // Tick IDs describe positions, not stable identities. Commit the new order on drop
    // instead of optimistically reordering DOM nodes behind React's positional keys.
    plugins: [SortableKeyboardPlugin, Feedback.configure({dropAnimation: null})],
  });

  return (
    <Col xs={12} sm={12} md={12} lg={8} xl={6} xxl={4} xxxl={3} ref={ref}>
      <GestureEditorTickCard
        tick={tick}
        dragHandleRef={handleRef}
        dragDisabled={pointer.ticks.length < 2}
        isDropTarget={isDropTarget}
        pointers={pointers}
        setPointers={setPointers}
        selectedTick={selectedTick}
        selectTick={selectTick}
        unselectTick={unselectTick}
      >
        <GestureEditorTickCardContents
          tick={tick}
          selectTick={selectTick}
          getDefaultMoveDuration={getDefaultMoveDuration}
          pointers={pointers}
          setPointers={setPointers}
        />
      </GestureEditorTickCard>
    </Col>
  );
};

/**
 * Contents of a pointer tab in the gesture editor.
 */
const GestureEditorPointerTabContents = ({
  pointer,
  pointers,
  setPointers,
  selectedTick,
  selectTick,
  unselectTick,
  getDefaultMoveDuration,
}) => {
  const handleDragEnd = (event) => {
    const {source, target, activatorEvent} = event.operation;
    if (!isSortable(source)) {
      return;
    }
    const updatedPointers =
      !event.canceled && isSortable(target)
        ? moveGestureTick(pointers, pointer.id, source.id, target.index - source.index)
        : pointers;
    if (updatedPointers !== pointers) {
      unselectTick();
      setPointers(updatedPointers);
    }
    if (activatorEvent instanceof KeyboardEvent) {
      // The default drop animation restores the old positional ID. Keep keyboard
      // focus on the moved action instead, or on the source if the drag was canceled.
      const handle = updatedPointers !== pointers ? target.sortable.draggable.handle : source.handle;
      requestAnimationFrame(() => handle?.focus());
    }
  };

  return (
    <DragDropProvider onDragEnd={handleDragEnd}>
      <Row gutter={[24, 24]}>
        {pointer.ticks.map((tick, index) => (
          <GestureEditorTick
            key={tick.id}
            tick={tick}
            index={index}
            pointer={pointer}
            pointers={pointers}
            setPointers={setPointers}
            selectedTick={selectedTick}
            selectTick={selectTick}
            unselectTick={unselectTick}
            getDefaultMoveDuration={getDefaultMoveDuration}
          />
        ))}
        <Col xs={12} sm={12} md={12} lg={8} xl={6} xxl={4} xxxl={3}>
          <AddNewTickButton id={pointer.id} pointers={pointers} setPointers={setPointers} />
        </Col>
      </Row>
    </DragDropProvider>
  );
};

export default GestureEditorPointerTabContents;
