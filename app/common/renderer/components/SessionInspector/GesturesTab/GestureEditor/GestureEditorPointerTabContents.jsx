import {IconPlus} from '@tabler/icons-react';
import {Button, Col, Row, Tooltip} from 'antd';
import {useTranslation} from 'react-i18next';

import styles from './GestureEditor.module.css';
import GestureEditorTickCard from './GestureEditorTickCard.jsx';
import GestureEditorTickCardContents from './GestureEditorTickCardContents.jsx';

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

  return (
    <div className={styles.tickPlusBtnWrapper}>
      <Tooltip title={t('Add')}>
        <Button icon={<IconPlus size={18} />} onClick={() => addTick(id, pointers, setPointers)} />
      </Tooltip>
    </div>
  );
};

/**
 * Single tick in a pointer.
 */
const GestureEditorTick = ({
  tick,
  pointers,
  setPointers,
  selectedTick,
  selectTick,
  unselectTick,
  getDefaultMoveDuration,
}) => (
  <GestureEditorTickCard
    tick={tick}
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
);

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
}) => (
  <Row gutter={[24, 24]}>
    {pointer.ticks.map((tick) => (
      <Col xs={12} sm={12} md={12} lg={8} xl={6} xxl={4} xxxl={3} key={tick.id}>
        <GestureEditorTick
          tick={tick}
          pointers={pointers}
          setPointers={setPointers}
          selectedTick={selectedTick}
          selectTick={selectTick}
          unselectTick={unselectTick}
          getDefaultMoveDuration={getDefaultMoveDuration}
        />
      </Col>
    ))}
    <Col xs={12} sm={12} md={12} lg={8} xl={6} xxl={4} xxxl={3}>
      <AddNewTickButton id={pointer.id} pointers={pointers} setPointers={setPointers} />
    </Col>
  </Row>
);

export default GestureEditorPointerTabContents;
