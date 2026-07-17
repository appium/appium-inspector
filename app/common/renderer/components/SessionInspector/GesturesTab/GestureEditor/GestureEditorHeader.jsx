import {IconArrowLeft, IconPlayerPlay} from '@tabler/icons-react';
import {Button, Col, Input, Row, Space, Tooltip} from 'antd';
import _ from 'lodash';
import {useCallback, useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';

import {NOTIF} from '../../../../constants/antd-types.js';
import {POINTER_MOVE_COORDS_TYPE, POINTER_TYPES} from '../../../../constants/gestures.js';
import {SCREENSHOT_INTERACTION_MODE} from '../../../../constants/screenshot.js';
import {notification} from '../../../../utils/notification.js';
import {percentageToPixels, pixelsToPercentage} from '../../../../utils/other.js';
import styles from './GestureEditor.module.css';

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

  const defaultGestureName = t('Untitled Gesture');
  const defaultGestureDescription = t('Add Description');

  const [name, setName] = useState(loadedGesture?.name ?? defaultGestureName);
  const [description, setDescription] = useState(
    loadedGesture?.description ?? defaultGestureDescription,
  );

  // This converts all the coordinates in the gesture to px/%
  const getConvertedPointers = useCallback(
    (type) => {
      const {width, height} = windowSize;
      if (type === coordType) {
        return pointers;
      }
      const newPointers = _.cloneDeep(pointers);
      for (const pointer of newPointers) {
        for (const tick of pointer.ticks) {
          if (tick.type === POINTER_TYPES.POINTER_MOVE) {
            if (type === POINTER_MOVE_COORDS_TYPE.PIXELS) {
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
    },
    [coordType, pointers, windowSize],
  );

  const onSave = () => {
    const {id, date} = loadedGesture;
    if (duplicatePointerNames(pointers)) {
      return null;
    }
    const gesture = {
      name,
      description,
      id,
      date,
      actions: getConvertedPointers(POINTER_MOVE_COORDS_TYPE.PERCENTAGES),
    };
    saveGesture(gesture);
    displayNotificationMsg(NOTIF.SUCCESS, t('Gesture saved'));
  };

  const onSaveAs = () => {
    if (duplicatePointerNames(pointers)) {
      return null;
    }
    const gesture = {
      name,
      description,
      actions: getConvertedPointers(POINTER_MOVE_COORDS_TYPE.PERCENTAGES),
    };
    saveGesture(gesture);
    displayNotificationMsg(NOTIF.SUCCESS, t('Gesture saved as', {gestureName: name}));
    onBack();
  };

  const onPlay = () => {
    if (duplicatePointerNames(pointers)) {
      return null;
    }
    const formattedPointers = getW3CPointers();
    applyClientMethod({methodName: SCREENSHOT_INTERACTION_MODE.GESTURE, args: [formattedPointers]});
  };

  const onBack = () => {
    unselectTick();
    removeGestureDisplay();
    removeLoadedGesture();
    hideGestureEditor();
  };

  // Check if pointer names are duplicates before saving/playing
  const duplicatePointerNames = (localPointers) => {
    const duplicates = {};
    for (const pointer of localPointers) {
      if (duplicates[pointer.name]) {
        displayNotificationMsg(NOTIF.ERROR, t('Duplicate pointer names are not allowed'));
        return true;
      } else {
        duplicates[pointer.name] = pointer;
      }
    }
    return false;
  };

  const displayNotificationMsg = (type, msg) => {
    notification[type]({
      title: msg,
      duration: 5,
    });
  };

  // Change gesture datastructure to fit Webdriver spec
  const getW3CPointers = () => {
    const newPointers = {};
    const currentPointers = getConvertedPointers(POINTER_MOVE_COORDS_TYPE.PIXELS);
    for (const pointer of currentPointers) {
      newPointers[pointer.name] = pointer.ticks.map((tick) => _.omit(tick, 'id'));
    }
    return newPointers;
  };

  // Draw gesture whenever pointers change
  useEffect(() => {
    const convertedPointers = getConvertedPointers(POINTER_MOVE_COORDS_TYPE.PIXELS);
    displayGesture(convertedPointers);
  }, [displayGesture, getConvertedPointers, pointers]);

  const headerTitle = (
    <Tooltip title={t('Edit')}>
      <Input
        defaultValue={name}
        className={styles.gestureHeaderTitle}
        onChange={(e) => setName(e.target.value)}
        size="small"
      />
    </Tooltip>
  );

  const headerButtons = (
    <Space>
      <Space.Compact>
        <Tooltip title={t('showMoveActionCoordsInPercentage')}>
          <Button
            type={coordType === POINTER_MOVE_COORDS_TYPE.PERCENTAGES ? 'primary' : 'default'}
            onClick={() => {
              setPointers(getConvertedPointers(POINTER_MOVE_COORDS_TYPE.PERCENTAGES));
              setCoordType(POINTER_MOVE_COORDS_TYPE.PERCENTAGES);
            }}
          >
            %
          </Button>
        </Tooltip>
        <Tooltip title={t('showMoveActionCoordsInPixels')}>
          <Button
            type={coordType === POINTER_MOVE_COORDS_TYPE.PIXELS ? 'primary' : 'default'}
            onClick={() => {
              setPointers(getConvertedPointers(POINTER_MOVE_COORDS_TYPE.PIXELS));
              setCoordType(POINTER_MOVE_COORDS_TYPE.PIXELS);
            }}
          >
            px
          </Button>
        </Tooltip>
      </Space.Compact>
      <Tooltip title={t('Play')}>
        <Button type="primary" icon={<IconPlayerPlay size={18} />} onClick={() => onPlay()} />
      </Tooltip>
      <Space.Compact>
        <Button onClick={() => onSaveAs()}>{t('saveAs')}</Button>
        <Button onClick={() => onSave()} disabled={!loadedGesture}>
          {t('Save')}
        </Button>
      </Space.Compact>
    </Space>
  );

  const headerDescription = (
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

  return (
    <>
      <Row justify="space-between">
        <Col flex="32px">
          <Button type="text" icon={<IconArrowLeft size={18} />} onClick={() => onBack()} />
        </Col>
        <Col flex="1">{headerTitle}</Col>
        <Col>{headerButtons}</Col>
      </Row>
      {headerDescription}
    </>
  );
};

export default GestureEditorHeader;
