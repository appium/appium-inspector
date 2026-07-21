import {Input, Tabs, Tooltip} from 'antd';
import {useState} from 'react';
import {useTranslation} from 'react-i18next';

import {TABLE_TAB} from '../../../../constants/antd-types.js';
import {CURSOR, POINTER_COLORS} from '../../../../constants/gestures.js';
import styles from './GestureEditor.module.css';
import GestureEditorPointerTabContents from './GestureEditorPointerTabContents.jsx';

const addPointer = (pointers) => {
  const key = pointers.length + 1;
  const pointerId = String(key);
  const copiedPointers = structuredClone(pointers);
  copiedPointers.push({
    name: `pointer${key}`,
    ticks: [{id: `${key}.1`}],
    id: pointerId,
    color: POINTER_COLORS[key - 1],
  });
  return [copiedPointers, pointerId];
};

const deletePointer = (targetKey, pointers, unselectTick) => {
  // 'newActivePointerId' variable keeps track of the previous pointer before deleting the current one
  // its default is the first pointer
  let newActivePointerId = '1';
  const pointersExceptCurrent = pointers.filter((pointer) => pointer.id !== targetKey);
  const newPointers = pointersExceptCurrent.map((pointer, index) => {
    const newPointerId = String(index + 1);
    if (newPointerId !== pointer.id) {
      pointer.id = newPointerId;
      pointer.color = POINTER_COLORS[index];
      pointer.ticks = pointer.ticks.map((tick) => {
        const tickIndex = tick.id.split('.')[1];
        tick.id = `${newPointerId}.${tickIndex}`;
        return tick;
      });
    } else {
      newActivePointerId = pointer.id;
    }
    return pointer;
  });
  unselectTick();
  return [newPointers, newActivePointerId];
};

/**
 * Title label of an individual tab in the gesture editor,
 */
const GestureEditorPointerLabel = ({pointer, index, activePointerId, pointers, setPointers}) => {
  const {t} = useTranslation();

  const updatePointerName = (pointerName, pointerIndex) => {
    const copiedPointers = structuredClone(pointers);
    copiedPointers[pointerIndex].name = pointerName;
    setPointers(copiedPointers);
  };

  return (
    <Tooltip title={t('Edit')}>
      <Input
        className={styles.pointerTitle}
        style={{
          cursor: activePointerId === pointer.id ? CURSOR.TEXT : CURSOR.POINTER,
          textDecorationColor: pointer.color,
        }}
        value={pointer.name}
        defaultValue={pointer.name}
        variant="borderless"
        maxLength={10}
        onChange={(e) => updatePointerName(e.target.value, index)}
      />
    </Tooltip>
  );
};

/**
 * Tab switcher in the gesture editor,
 * where each tab is a separate pointer in the gesture
 */
const GestureEditorPointerTabs = ({
  pointers,
  setPointers,
  selectedTick,
  selectTick,
  unselectTick,
  getDefaultMoveDuration,
}) => {
  const [activePointerId, setActivePointerId] = useState('1');

  const pointerTabs = pointers.map((pointer, index) => ({
    label: (
      <GestureEditorPointerLabel
        pointer={pointer}
        index={index}
        activePointerId={activePointerId}
        pointers={pointers}
        setPointers={setPointers}
      />
    ),
    key: pointer.id,
    closable: pointer.id !== '1',
    children: (
      <GestureEditorPointerTabContents
        pointer={pointer}
        pointers={pointers}
        setPointers={setPointers}
        selectedTick={selectedTick}
        selectTick={selectTick}
        unselectTick={unselectTick}
        getDefaultMoveDuration={getDefaultMoveDuration}
      />
    ),
  }));

  const addOrRemovePointer = (targetKey, action) => {
    let newPointers, newActivePointerId;
    if (action === TABLE_TAB.ADD) {
      [newPointers, newActivePointerId] = addPointer(pointers);
    } else {
      [newPointers, newActivePointerId] = deletePointer(targetKey, pointers, unselectTick);
    }
    setPointers(newPointers);
    setActivePointerId(newActivePointerId);
  };

  return (
    <Tabs
      type="editable-card"
      onChange={(pointerId) => setActivePointerId(pointerId)}
      activeKey={activePointerId}
      onEdit={addOrRemovePointer}
      hideAdd={pointers.length === 5}
      centered={true}
      tabBarGutter={10}
      items={pointerTabs}
    />
  );
};

export default GestureEditorPointerTabs;
