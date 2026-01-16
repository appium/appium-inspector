import {IconDeviceFloppy, IconEdit, IconX} from '@tabler/icons-react';
import {Alert, Button, Card, Input, Row, Tooltip} from 'antd';
import {useTranslation} from 'react-i18next';
import {Refractor, registerLanguage} from 'react-refractor';
import json from 'refractor/json';

import {getCapsObject} from '../../../actions/SessionBuilder.js';
import {ALERT} from '../../../constants/antd-types.js';
import builderStyles from '../SessionBuilder.module.css';
import styles from './CapabilityJSON.module.css';

registerLanguage(json);

const CapabilityJSON = (props) => {
  const {
    caps,
    title,
    desiredCapsName,
    isEditingDesiredCapsName,
    isEditingDesiredCaps,
    startDesiredCapsEditor,
    abortDesiredCapsEditor,
    saveRawDesiredCaps,
    setRawDesiredCaps,
    rawDesiredCaps,
    isValidCapsJson,
    invalidCapsJsonReason,
    isDuplicateCapsName,
  } = props;

  const {t} = useTranslation();

  const getHighlightedCaps = (caps) => {
    const formattedJson = JSON.stringify(getCapsObject(caps), null, 2);
    return <Refractor language="json" value={formattedJson} />;
  };

  const setCapsTitle = () => {
    const {setDesiredCapsName, saveDesiredCapsName} = props;
    if (!title) {
      return t('JSON Representation');
    } else if (!isEditingDesiredCapsName) {
      return title;
    } else {
      return (
        <Row className={styles.capsEditorTitle}>
          <Input
            onChange={(e) => setDesiredCapsName(e.target.value)}
            value={desiredCapsName}
            className={styles.capsEditorTitleInput}
            onPressEnter={saveDesiredCapsName}
            status={isDuplicateCapsName ? 'error' : ''}
          />
          {isDuplicateCapsName && (
            <p className={builderStyles.errorMessage}> {t('duplicateCapabilityNameError')}</p>
          )}
        </Row>
      );
    }
  };

  const setCapsTitleButtons = () => {
    const {startDesiredCapsNameEditor, abortDesiredCapsNameEditor, saveDesiredCapsName} = props;
    if (!title) {
      return null;
    } else if (!isEditingDesiredCapsName) {
      return (
        <Tooltip title={t('Edit')}>
          <Button
            size="small"
            onClick={startDesiredCapsNameEditor}
            icon={<IconEdit size={14} />}
            className={styles.capsNameEditorButton}
          />
        </Tooltip>
      );
    } else {
      return (
        <>
          <Tooltip title={t('Cancel')}>
            <Button
              size="small"
              color="danger"
              variant="outlined"
              onClick={abortDesiredCapsNameEditor}
              icon={<IconX size={14} />}
              className={styles.capsNameEditorButton}
            />
          </Tooltip>
          <Tooltip title={t('Save')}>
            <Button
              size="small"
              color="primary"
              variant="outlined"
              onClick={saveDesiredCapsName}
              icon={<IconDeviceFloppy size={14} />}
              className={styles.capsNameEditorButton}
            />
          </Tooltip>
        </>
      );
    }
  };

  return (
    caps && (
      <Card className={styles.formattedCaps} title={setCapsTitle()} extra={setCapsTitleButtons()}>
        <div className={styles.capsEditorControls}>
          {isEditingDesiredCaps && (
            <Tooltip title={t('Cancel')}>
              <Button
                color="danger"
                variant="outlined"
                onClick={abortDesiredCapsEditor}
                icon={<IconX size={20} />}
                className={styles.capsEditorButton}
              />
            </Tooltip>
          )}
          {isEditingDesiredCaps && (
            <Tooltip title={t('Save')}>
              <Button
                color="primary"
                variant="outlined"
                onClick={() => saveRawDesiredCaps(caps, rawDesiredCaps)}
                icon={<IconDeviceFloppy size={20} />}
                className={styles.capsEditorButton}
              />
            </Tooltip>
          )}
          {!isEditingDesiredCaps && (
            <Tooltip title={t('Edit Raw JSON')} placement="topRight">
              <Button onClick={startDesiredCapsEditor} icon={<IconEdit size={18} />} />
            </Tooltip>
          )}
        </div>
        {isEditingDesiredCaps && (
          <div className={styles.capsEditor}>
            <Input.TextArea
              onChange={(e) => setRawDesiredCaps(e.target.value)}
              value={rawDesiredCaps}
              className={`${styles.capsEditorBody} ${
                isValidCapsJson ? styles.capsEditorBodyFull : styles.capsEditorBodyResized
              }`}
            />
            {!isValidCapsJson && <Alert title={invalidCapsJsonReason} type={ALERT.ERROR} />}
          </div>
        )}
        {!isEditingDesiredCaps && (
          <div className={styles.formattedCapsBody}>{getHighlightedCaps(caps)}</div>
        )}
      </Card>
    )
  );
};

export default CapabilityJSON;
