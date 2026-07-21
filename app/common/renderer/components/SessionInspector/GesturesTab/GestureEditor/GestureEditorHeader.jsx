import {IconArrowLeft, IconPlayerPlay} from '@tabler/icons-react';
import {Button, Col, Input, Row, Space, Tooltip} from 'antd';
import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';

import {NOTIF} from '../../../../constants/antd-types.js';
import {POINTER_MOVE_COORDS_TYPE, POINTER_TYPES} from '../../../../constants/gestures.js';
import {SCREENSHOT_INTERACTION_MODE} from '../../../../constants/screenshot.js';
import {omit} from '../../../../utils/lang.js';
import {notification} from '../../../../utils/notification.js';
import {percentageToPixels, pixelsToPercentage} from '../../../../utils/other.js';
import styles from './GestureEditor.module.css';

const displayNotificationMsg = (type, msg) => {
  notification[type]({
    title: msg,
    duration: 5,
  });
};

// Check if pointer names are duplicates before saving/playing
const duplicatePointerNames = (pointers, t) => {
  const duplicates = {};
  for (const pointer of pointers) {
    if (duplicates[pointer.name]) {
      displayNotificationMsg(NOTIF.ERROR, t('Duplicate pointer names are not allowed'));
      return true;
    } else {
      duplicates[pointer.name] = pointer;
    }
  }
  return false;
};

// Convert all the coordinates in the gesture to the specified type (pixels or %)
const convertPointerCoordsType = (newCoordType, coordType, windowSize, pointers) => {
  if (newCoordType === coordType) {
    return pointers;
  }
  const {width, height} = windowSize;
  const newPointers = structuredClone(pointers);
  for (const pointer of newPointers) {
    for (const tick of pointer.ticks) {
      if (tick.type === POINTER_TYPES.POINTER_MOVE) {
        if (newCoordType === POINTER_MOVE_COORDS_TYPE.PIXELS) {
          tick.x = percentageToPixels(tick.x, width);
          tick.y = percentageToPixels(tick.y, height);
        } else {
          tick.x = pixelsToPercentage(tick.x, width);
          tick.y = pixelsToPercentage(tick.y, height);
        }
      }
    }
  }
  return newPointers;
};

/**
 * Back button to return to the saved gestures list.
 */
const GestureEditorBackButton = ({closeGestureEditor}) => (
  <Button type="text" icon={<IconArrowLeft size={18} />} onClick={() => closeGestureEditor()} />
);

/**
 * Editable title of the current gesture.
 */
const GestureEditorTitle = ({name, setName}) => {
  const {t} = useTranslation();

  return (
    <Tooltip title={t('Edit')}>
      <Input
        defaultValue={name}
        className={styles.gestureHeaderTitle}
        onChange={(e) => setName(e.target.value)}
        size="small"
      />
    </Tooltip>
  );
};

/**
 * Buttons shown in the header of the current gesture.
 */
const GestureEditorHeaderButtons = ({
  coordType,
  switchCoordsType,
  playCurrentGesture,
  saveCurrentGesture,
  saveCurrentGestureAs,
  loadedGesture,
}) => {
  const {t} = useTranslation();

  return (
    <Space>
      <Space.Compact>
        <Tooltip title={t('showMoveActionCoordsInPercentage')}>
          <Button
            type={coordType === POINTER_MOVE_COORDS_TYPE.PERCENTAGES ? 'primary' : 'default'}
            onClick={() => switchCoordsType(POINTER_MOVE_COORDS_TYPE.PERCENTAGES)}
          >
            %
          </Button>
        </Tooltip>
        <Tooltip title={t('showMoveActionCoordsInPixels')}>
          <Button
            type={coordType === POINTER_MOVE_COORDS_TYPE.PIXELS ? 'primary' : 'default'}
            onClick={() => switchCoordsType(POINTER_MOVE_COORDS_TYPE.PIXELS)}
          >
            px
          </Button>
        </Tooltip>
      </Space.Compact>
      <Tooltip title={t('Play')}>
        <Button
          type="primary"
          icon={<IconPlayerPlay size={18} />}
          onClick={() => playCurrentGesture()}
        />
      </Tooltip>
      <Space.Compact>
        <Button onClick={() => saveCurrentGestureAs()}>{t('saveAs')}</Button>
        <Button onClick={() => saveCurrentGesture()} disabled={!loadedGesture}>
          {t('Save')}
        </Button>
      </Space.Compact>
    </Space>
  );
};

/**
 * Editable description of the current gesture.
 */
const GestureEditorDescription = ({description, setDescription}) => {
  const {t} = useTranslation();

  return (
    <div className={styles.gestureHeaderDescription}>
      <Tooltip title={t('Edit')}>
        <Input
          defaultValue={description}
          className={styles.gestureHeaderDescriptionInput}
          onChange={(e) => setDescription(e.target.value)}
          size="small"
        />
      </Tooltip>
    </div>
  );
};

/**
 * Header controls shown in the gesture editor.
 */
const GestureEditorHeader = (props) => {
  const {
    pointers,
    setPointers,
    coordType,
    setCoordType,
    loadedGesture,
    saveGesture,
    unselectTick,
    hideGestureEditor,
    removeLoadedGesture,
    removeGestureDisplay,
    applyClientMethod,
    displayGesture,
    windowSize,
  } = props;
  const {t} = useTranslation();

  const defaultName = t('Untitled Gesture');
  const defaultDescription = t('Add Description');

  const [name, setName] = useState(loadedGesture?.name ?? defaultName);
  const [description, setDescription] = useState(loadedGesture?.description ?? defaultDescription);

  const saveCurrentGesture = () => {
    const {id, date} = loadedGesture;
    if (duplicatePointerNames(pointers, t)) {
      return null;
    }
    const gesture = {
      name,
      description,
      id,
      date,
      actions: convertPointerCoordsType(
        POINTER_MOVE_COORDS_TYPE.PERCENTAGES,
        coordType,
        windowSize,
        pointers,
      ),
    };
    saveGesture(gesture);
    displayNotificationMsg(NOTIF.SUCCESS, t('Gesture saved'));
  };

  const saveCurrentGestureAs = () => {
    if (duplicatePointerNames(pointers, t)) {
      return null;
    }
    const gesture = {
      name,
      description,
      actions: convertPointerCoordsType(
        POINTER_MOVE_COORDS_TYPE.PERCENTAGES,
        coordType,
        windowSize,
        pointers,
      ),
    };
    saveGesture(gesture);
    displayNotificationMsg(NOTIF.SUCCESS, t('Gesture saved as', {gestureName: name}));
    closeGestureEditor();
  };

  const playCurrentGesture = () => {
    if (duplicatePointerNames(pointers, t)) {
      return null;
    }
    const formattedPointers = {};
    // Change gesture datastructure to fit Webdriver spec
    const currentPointers = convertPointerCoordsType(
      POINTER_MOVE_COORDS_TYPE.PIXELS,
      coordType,
      windowSize,
      pointers,
    );
    for (const pointer of currentPointers) {
      formattedPointers[pointer.name] = pointer.ticks.map((tick) => omit(tick, 'id'));
    }
    applyClientMethod({methodName: SCREENSHOT_INTERACTION_MODE.GESTURE, args: [formattedPointers]});
  };

  const closeGestureEditor = () => {
    unselectTick();
    removeGestureDisplay();
    removeLoadedGesture();
    hideGestureEditor();
  };

  const switchCoordsType = (newCoordType) => {
    setPointers(convertPointerCoordsType(newCoordType, coordType, windowSize, pointers));
    setCoordType(newCoordType);
  };

  // Draw gesture whenever pointers change
  useEffect(() => {
    const convertedPointers = convertPointerCoordsType(
      POINTER_MOVE_COORDS_TYPE.PIXELS,
      coordType,
      windowSize,
      pointers,
    );
    displayGesture(convertedPointers);
  }, [coordType, displayGesture, pointers, windowSize]);

  return (
    <>
      <Row justify="space-between">
        <Col flex="32px">
          <GestureEditorBackButton closeGestureEditor={closeGestureEditor} />
        </Col>
        <Col flex="1">
          <GestureEditorTitle name={name} setName={setName} />
        </Col>
        <Col>
          <GestureEditorHeaderButtons
            coordType={coordType}
            switchCoordsType={switchCoordsType}
            playCurrentGesture={playCurrentGesture}
            saveCurrentGesture={saveCurrentGesture}
            saveCurrentGestureAs={saveCurrentGestureAs}
            loadedGesture={loadedGesture}
          />
        </Col>
      </Row>
      <GestureEditorDescription description={description} setDescription={setDescription} />
    </>
  );
};

export default GestureEditorHeader;
