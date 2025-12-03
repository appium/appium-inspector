import {CloseOutlined, EditOutlined, SaveOutlined} from '@ant-design/icons';
import {Alert, Button, Card, Input, Row, Tooltip} from 'antd';
import hljs from 'highlight.js';

import {getCapsObject} from '../../../actions/SessionBuilder.js';
import {ALERT} from '../../../constants/antd-types.js';
import builderStyles from '../SessionBuilder.module.css';
import styles from './CapabilityJSON.module.css';

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
    t,
  } = props;

  const getHighlightedCaps = (caps) => {
    const formattedJson = JSON.stringify(getCapsObject(caps), null, 2);
    return hljs.highlight(formattedJson, {language: 'json'}).value;
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
            className={styles.capsEditorTitle}
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
            icon={<EditOutlined />}
            className={styles.capsNameEditorButton}
          />
        </Tooltip>
      );
    } else {
      return (
        <div>
          <Tooltip title={t('Cancel')}>
            <Button
              size="small"
              color="danger"
              variant="outlined"
              onClick={abortDesiredCapsNameEditor}
              icon={<CloseOutlined />}
              className={styles.capsNameEditorButton}
            />
          </Tooltip>
          <Tooltip title={t('Save')}>
            <Button
              size="small"
              color="primary"
              variant="outlined"
              onClick={saveDesiredCapsName}
              icon={<SaveOutlined />}
              className={styles.capsNameEditorButton}
            />
          </Tooltip>
        </div>
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
                icon={<CloseOutlined />}
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
                icon={<SaveOutlined />}
                className={styles.capsEditorButton}
              />
            </Tooltip>
          )}
          {!isEditingDesiredCaps && (
            <Tooltip title={t('Edit Raw JSON')} placement="topRight">
              <Button onClick={startDesiredCapsEditor} icon={<EditOutlined />} />
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
            {!isValidCapsJson && <Alert message={invalidCapsJsonReason} type={ALERT.ERROR} />}
          </div>
        )}
        {!isEditingDesiredCaps && (
          <div className={styles.formattedCapsBody}>
            <pre>
              {/* eslint-disable-next-line @eslint-react/dom/no-dangerously-set-innerhtml --
              We assume that the user considers their own input to be safe */}
              <code dangerouslySetInnerHTML={{__html: getHighlightedCaps(caps)}} />
            </pre>
          </div>
        )}
      </Card>
    )
  );
};

export default CapabilityJSON;
