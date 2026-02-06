import {IconEraser, IconFocus2, IconSend2, IconStopwatch} from '@tabler/icons-react';
import {Button, Input, Row, Space, Tooltip} from 'antd';
import {useRef} from 'react';
import {useTranslation} from 'react-i18next';

import {ROW} from '../../../../constants/antd-types.js';
import styles from '../Source.module.css';

/**
 * Action buttons for the selected element, including tap, send keys, clear, and get timing.
 */
const SelectedElementActions = (props) => {
  const {
    elementActionsDisabled,
    elementInteractionsNotAvailable,
    selectedElementSearchInProgress,
    applyClientMethod,
    selectedElementId,
    getFindElementsTimes,
    elementLocatorsData,
  } = props;
  const {t} = useTranslation();
  const sendKeysRef = useRef(null);

  const tapButtonLoadingState =
    !(elementInteractionsNotAvailable || selectedElementId) || selectedElementSearchInProgress;

  return (
    <Row justify="center" type={ROW.FLEX} align="middle" className={styles.selectedElemActions}>
      <Tooltip title={t('Tap')}>
        <Button
          disabled={elementActionsDisabled}
          icon={<IconFocus2 size={18} />}
          loading={tapButtonLoadingState}
          id="btnTapElement"
          onClick={() =>
            applyClientMethod({methodName: 'elementClick', elementId: selectedElementId})
          }
        />
      </Tooltip>
      <Space.Compact className={styles.elementKeyInputActions}>
        <Input
          className={styles.elementKeyInput}
          disabled={elementActionsDisabled}
          placeholder={t('Enter Keys to Send')}
          allowClear={true}
          onChange={(e) => (sendKeysRef.current = e.target.value)}
        />
        <Tooltip title={t('Send Keys')}>
          <Button
            disabled={elementActionsDisabled}
            id="btnSendKeysToElement"
            icon={<IconSend2 size={18} />}
            onClick={() =>
              applyClientMethod({
                methodName: 'elementSendKeys',
                elementId: selectedElementId,
                args: [sendKeysRef.current || ''],
              })
            }
          />
        </Tooltip>
        <Tooltip title={t('Clear')}>
          <Button
            disabled={elementActionsDisabled}
            id="btnClearElement"
            icon={<IconEraser size={18} />}
            onClick={() =>
              applyClientMethod({methodName: 'elementClear', elementId: selectedElementId})
            }
          />
        </Tooltip>
      </Space.Compact>
      <Tooltip title={t('Get Timing')}>
        <Button
          disabled={elementActionsDisabled}
          id="btnGetTiming"
          icon={<IconStopwatch size={18} />}
          onClick={() => getFindElementsTimes(elementLocatorsData)}
        />
      </Tooltip>
    </Row>
  );
};

export default SelectedElementActions;
